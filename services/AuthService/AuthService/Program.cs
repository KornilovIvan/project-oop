using Grpc.Core;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Grpc;
var b=WebApplication.CreateBuilder(args);
b.WebHost.ConfigureKestrel(o=>o.ConfigureEndpointDefaults(lo=>lo.Protocols=HttpProtocols.Http2));
b.Services.AddGrpc();
b.Services.AddDbContext<AuthDb>(o=>o.UseNpgsql(b.Configuration.GetConnectionString("DefaultConnection")));
b.Services.AddScoped<AuthLogic>();
var app=b.Build();
using(var s=app.Services.CreateScope()){s.ServiceProvider.GetRequiredService<AuthDb>().Database.EnsureCreated();}
app.MapGrpcService<AuthHandler>();
app.Run();
public class AuthDb:DbContext{public AuthDb(DbContextOptions<AuthDb>o):base(o){}public DbSet<User> Users=>Set<User>();}
public enum UserRole{Admin=1,Manager=2,Executor=3,Observer=4}
public class User{public int Id{get;set;}public string Username{get;set;}="";public string Email{get;set;}="";public string PasswordHash{get;set;}="";public UserRole Role{get;set;}}
public class AuthLogic{readonly AuthDb _db;public AuthLogic(AuthDb db)=>_db=db;public async Task<User> Register(string un,string em,string pw,UserRole r,CancellationToken ct){if(await _db.Users.AnyAsync(u=>u.Email==em,ct))throw new RpcException(new Status(StatusCode.AlreadyExists,"Email exists"));var u=new User{Username=un,Email=em,PasswordHash=BCrypt.Net.BCrypt.HashPassword(pw),Role=r};_db.Users.Add(u);await _db.SaveChangesAsync(ct);return u;}public async Task<User> Login(string em,string pw,CancellationToken ct){var u=await _db.Users.FirstOrDefaultAsync(x=>x.Email==em,ct);if(u is null||!BCrypt.Net.BCrypt.Verify(pw,u.PasswordHash))throw new RpcException(new Status(StatusCode.Unauthenticated,"Invalid credentials"));return u;}}
public class AuthHandler:AuthService.AuthServiceBase{readonly AuthLogic _svc;public AuthHandler(AuthLogic svc)=>_svc=svc;public override async Task<LoginResponse> Login(LoginRequest r,ServerCallContext ctx){var u=await _svc.Login(r.Email,r.Password,ctx.CancellationToken);return new LoginResponse{Token="jwt",User=ToProto(u),ExpiresAt=Google.Protobuf.WellKnownTypes.Timestamp.FromDateTime(DateTime.UtcNow.AddHours(1))};}public override async Task<UserResponse> Register(RegisterRequest r,ServerCallContext ctx){var u=await _svc.Register(r.Username,r.Email,r.Password,(UserRole)r.Role,ctx.CancellationToken);return ToProto(u);}static UserResponse ToProto(User u)=>new(){Id=u.Id,Username=u.Username,Email=u.Email,Role=(TaskManagement.Grpc.UserRole)u.Role};}
