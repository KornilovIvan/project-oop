using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var b = WebApplication.CreateBuilder(args);
// HTTP/1.1 (no HTTP/2 needed for REST)
b.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
b.Services.AddDbContext<AuthDb>(o => o.UseNpgsql(b.Configuration.GetConnectionString("DefaultConnection")));
b.Services.AddScoped<AuthLogic>();
var app = b.Build();
using (var scope = app.Services.CreateScope()) { var db = scope.ServiceProvider.GetRequiredService<AuthDb>(); db.Database.EnsureCreated(); }

app.MapPost("/api/auth/register", async (RegisterReq r, AuthLogic svc, CancellationToken ct) => {
    try { var u = await svc.Register(r.Username, r.Email, r.Password, (UserRole)r.Role, ct); return Results.Ok(new { u.Id, u.Username, u.Email, u.Role }); }
    catch (Exception e) { return Results.Problem(e.Message, statusCode: 400); }
});
app.MapPost("/api/auth/login", async (LoginReq r, AuthLogic svc, CancellationToken ct) => {
    try { var u = await svc.Login(r.Email, r.Password, ct); return Results.Ok(new { token = "jwt", user = new { u.Id, u.Username, u.Email, u.Role } }); }
    catch (Exception e) { return Results.Problem(e.Message, statusCode: 400); }
});
app.MapGet("/health", () => "OK");
app.Run();

public record RegisterReq(string Username, string Email, string Password, int Role);
public record LoginReq(string Email, string Password);
public enum UserRole { Admin=1, Manager=2, Executor=3, Observer=4 }
public class User { public int Id{get;set;} public string Username{get;set;}=""; public string Email{get;set;}=""; public string PasswordHash{get;set;}=""; public UserRole Role{get;set;} }
public class AuthDb:DbContext { public AuthDb(DbContextOptions<AuthDb>o):base(o){} public DbSet<User> Users=>Set<User>(); }
public class AuthLogic {
    readonly AuthDb _db; public AuthLogic(AuthDb db)=>_db=db;
    public async Task<User> Register(string un,string em,string pw,UserRole r,CancellationToken ct) {
        if(await _db.Users.AnyAsync(u=>u.Email==em,ct)) throw new Exception("Email exists");
        var u=new User{Username=un,Email=em,PasswordHash=BCrypt.Net.BCrypt.HashPassword(pw),Role=r};
        _db.Users.Add(u); await _db.SaveChangesAsync(ct); return u;
    }
    public async Task<User> Login(string em,string pw,CancellationToken ct) {
        var u=await _db.Users.FirstOrDefaultAsync(x=>x.Email==em,ct);
        if(u is null||!BCrypt.Net.BCrypt.Verify(pw,u.PasswordHash)) throw new Exception("Invalid credentials");
        return u;
    }
}
