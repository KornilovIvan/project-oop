using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://+:5000");
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));
var app = builder.Build();
app.UseCors();

var http = new HttpClient();

async Task<IResult> Proxy(string url, HttpRequest incoming)
{
    using var reader = new StreamReader(incoming.Body);
    var body = await reader.ReadToEndAsync();
    var resp = await http.PostAsync(url, new StringContent(body, Encoding.UTF8, "application/json"));
    var respBody = await resp.Content.ReadAsStringAsync();
    return resp.IsSuccessStatusCode ? Results.Content(respBody, "application/json") : Results.Problem(respBody, statusCode: (int)resp.StatusCode);
}

async Task<IResult> ProxyGet(string url)
{
    var resp = await http.GetAsync(url);
    var respBody = await resp.Content.ReadAsStringAsync();
    return resp.IsSuccessStatusCode ? Results.Content(respBody, "application/json") : Results.Problem(respBody, statusCode: (int)resp.StatusCode);
}

app.MapPost("/api/auth/register", (HttpRequest r) => Proxy("http://auth-service:5001/api/auth/register", r));
app.MapPost("/api/auth/login", (HttpRequest r) => Proxy("http://auth-service:5001/api/auth/login", r));
app.MapGet("/api/projects", () => ProxyGet("http://project-service:5002/api/projects"));
app.MapPost("/api/projects", (HttpRequest r) => Proxy("http://project-service:5002/api/projects", r));
app.MapGet("/api/projects/{pid}/tasks", (int pid) => ProxyGet($"http://task-service:5003/api/projects/{pid}/tasks"));
app.MapPost("/api/tasks", (HttpRequest r) => Proxy("http://task-service:5003/api/tasks", r));
app.MapPost("/api/tasks/{tid}/status", (int tid, HttpRequest r) => Proxy($"http://task-service:5003/api/tasks/{tid}/status", r));
app.MapGet("/health", () => "OK");
app.Run();
