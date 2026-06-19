using Microsoft.EntityFrameworkCore;

var b = WebApplication.CreateBuilder(args);
// HTTP/1.1
b.Services.AddDbContext<ProjectDb>(o => o.UseNpgsql(b.Configuration.GetConnectionString("DefaultConnection")));
b.Services.AddScoped<ProjectLogic>();
var app = b.Build();
using (var scope = app.Services.CreateScope()) { var db = scope.ServiceProvider.GetRequiredService<ProjectDb>(); db.Database.EnsureCreated(); }

app.MapPost("/api/projects", async (CreateReq r, ProjectLogic svc, CancellationToken ct) => {
    var p = await svc.Create(r.Name, r.Description, r.CreatedById, ct);
    return Results.Ok(new { p.Id, p.Name, p.Description, p.CreatedById });
});
app.MapGet("/api/projects", async (ProjectLogic svc, CancellationToken ct) => Results.Ok(await svc.List(ct)));
app.MapGet("/health", () => "OK");
app.Run();

public record CreateReq(string Name, string Description, int CreatedById);
public class Project { public int Id{get;set;} public string Name{get;set;}=""; public string Description{get;set;}=""; public int CreatedById{get;set;} }
public class ProjectDb:DbContext { public ProjectDb(DbContextOptions<ProjectDb>o):base(o){} public DbSet<Project> Projects=>Set<Project>(); }
public class ProjectLogic {
    readonly ProjectDb _db; public ProjectLogic(ProjectDb db)=>_db=db;
    public async Task<Project> Create(string name,string desc,int uid,CancellationToken ct) { var p=new Project{Name=name,Description=desc,CreatedById=uid}; _db.Projects.Add(p); await _db.SaveChangesAsync(ct); return p; }
    public async Task<List<Project>> List(CancellationToken ct)=>await _db.Projects.OrderByDescending(p=>p.Id).ToListAsync(ct);
}
