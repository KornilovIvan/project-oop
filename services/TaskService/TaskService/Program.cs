using Microsoft.EntityFrameworkCore;

var b = WebApplication.CreateBuilder(args);
// HTTP/1.1
b.Services.AddDbContext<TaskDb>(o => o.UseNpgsql(b.Configuration.GetConnectionString("DefaultConnection")));
b.Services.AddScoped<TaskLogic>();
var app = b.Build();
using (var scope = app.Services.CreateScope()) { var db = scope.ServiceProvider.GetRequiredService<TaskDb>(); db.Database.EnsureCreated(); }

app.MapPost("/api/tasks", async (CreateReq r, TaskLogic svc, CancellationToken ct) => {
    var t = await svc.Create(r.Title, r.ProjectId, r.Priority, r.CreatedById, ct);
    return Results.Ok(new { t.Id, t.Title, t.ProjectId, t.Status, t.Priority, t.CreatedById });
});
app.MapGet("/api/projects/{pid}/tasks", async (int pid, TaskLogic svc, CancellationToken ct) => Results.Ok(await svc.List(pid, ct)));
app.MapPost("/api/tasks/{tid}/status", async (int tid, StatusReq r, TaskLogic svc, CancellationToken ct) => {
    var t = await svc.ChangeStatus(tid, r.Status, r.ActorId, ct);
    return Results.Ok(new { t.Id, t.Title, t.ProjectId, t.Status, t.Priority, t.CreatedById });
});
app.MapGet("/health", () => "OK");
app.Run();

public record CreateReq(string Title, int ProjectId, int Priority, int CreatedById);
public record StatusReq(int Status, int ActorId);
public class TaskItem { public int Id{get;set;} public string Title{get;set;}=""; public int ProjectId{get;set;} public int Status{get;set;} public int Priority{get;set;} public int CreatedById{get;set;} public DateTime CreatedAt{get;set;}=DateTime.UtcNow; }
public class TaskDb:DbContext { public TaskDb(DbContextOptions<TaskDb>o):base(o){} public DbSet<TaskItem> Tasks=>Set<TaskItem>(); }
public class TaskLogic {
    readonly TaskDb _db; public TaskLogic(TaskDb db)=>_db=db;
    public async Task<TaskItem> Create(string title,int pid,int prio,int uid,CancellationToken ct) { var t=new TaskItem{Title=title,ProjectId=pid,Priority=prio,CreatedById=uid,Status=1}; _db.Tasks.Add(t); await _db.SaveChangesAsync(ct); return t; }
    public async Task<List<TaskItem>> List(int pid,CancellationToken ct)=>await _db.Tasks.Where(t=>t.ProjectId==pid).OrderByDescending(t=>t.CreatedAt).ToListAsync(ct);
    public async Task<TaskItem> ChangeStatus(int tid,int status,int aid,CancellationToken ct) { var t=await _db.Tasks.FirstOrDefaultAsync(x=>x.Id==tid,ct) ?? throw new Exception("Task not found"); t.Status=status; await _db.SaveChangesAsync(ct); return t; }
}
