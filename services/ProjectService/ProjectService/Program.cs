using Grpc.Core;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Grpc;
var b=WebApplication.CreateBuilder(args);
b.WebHost.ConfigureKestrel(o=>o.ConfigureEndpointDefaults(lo=>lo.Protocols=HttpProtocols.Http2));
b.Services.AddGrpc();
b.Services.AddDbContext<ProjectDb>(o=>o.UseNpgsql(b.Configuration.GetConnectionString("DefaultConnection")));
b.Services.AddScoped<ProjectLogic>();
var app=b.Build();
using(var s=app.Services.CreateScope()){s.ServiceProvider.GetRequiredService<ProjectDb>().Database.EnsureCreated();}
app.MapGrpcService<ProjectHandler>();
app.Run();
public class ProjectDb:DbContext{public ProjectDb(DbContextOptions<ProjectDb>o):base(o){}public DbSet<Project> Projects=>Set<Project>();}
public class Project{public int Id{get;set;}public string Name{get;set;}="";public string Description{get;set;}="";public int CreatedById{get;set;}}
public class ProjectLogic{readonly ProjectDb _db;public ProjectLogic(ProjectDb db)=>_db=db;public async Task<Project> Create(string n,string d,int uid,CancellationToken ct){var p=new Project{Name=n,Description=d,CreatedById=uid};_db.Projects.Add(p);await _db.SaveChangesAsync(ct);return p;}public async Task<List<Project>> List(CancellationToken ct)=>await _db.Projects.OrderByDescending(p=>p.Id).ToListAsync(ct);}
public class ProjectHandler:ProjectService.ProjectServiceBase{readonly ProjectLogic _svc;public ProjectHandler(ProjectLogic svc)=>_svc=svc;public override async Task<ProjectResponse> CreateProject(CreateProjectRequest r,ServerCallContext ctx){var p=await _svc.Create(r.Name,r.Description,r.CreatedById,ctx.CancellationToken);return new ProjectResponse{Id=p.Id,Name=p.Name,Description=p.Description,CreatedById=p.CreatedById};}public override async Task<ListProjectsResponse> ListProjects(ListProjectsRequest r,ServerCallContext ctx){var l=await _svc.List(ctx.CancellationToken);var resp=new ListProjectsResponse();foreach(var p in l)resp.Projects.Add(new ProjectResponse{Id=p.Id,Name=p.Name,Description=p.Description,CreatedById=p.CreatedById});return resp;}}
