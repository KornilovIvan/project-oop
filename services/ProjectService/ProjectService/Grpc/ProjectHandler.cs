using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using ProjectService.Models;
using ProjectService.Services;
using TaskManagement.Grpc;

namespace ProjectService.Grpc;

public class ProjectHandler(ProjectLogic projects) : TaskManagement.Grpc.ProjectService.ProjectServiceBase
{
    public override async Task<ProjectResponse> CreateProject(
        CreateProjectRequest request,
        ServerCallContext context)
    {
        var project = await projects.Create(
            request.Name,
            request.Description,
            request.CreatedById,
            context.CancellationToken);

        return ToProto(project);
    }

    public override async Task<ProjectResponse> GetProject(
        GetProjectRequest request,
        ServerCallContext context)
    {
        var project = await projects.Get(request.Id, context.CancellationToken);
        return ToProto(project);
    }

    public override async Task<ListProjectsResponse> ListProjects(
        ListProjectsRequest request,
        ServerCallContext context)
    {
        var projectList = await projects.List(request.UserId, context.CancellationToken);
        var response = new ListProjectsResponse();

        foreach (var project in projectList)
            response.Projects.Add(ToProto(project));

        return response;
    }

    public override async Task<ProjectResponse> AddMember(
        AddProjectMemberRequest request,
        ServerCallContext context)
    {
        var project = await projects.AddMember(
            request.ProjectId,
            request.UserId,
            context.CancellationToken);

        return ToProto(project);
    }

    public override async Task<Empty> RemoveMember(
        RemoveProjectMemberRequest request,
        ServerCallContext context)
    {
        await projects.RemoveMember(
            request.ProjectId,
            request.UserId,
            context.CancellationToken);

        return new Empty();
    }

    public override async Task<Empty> DeleteProject(
        DeleteProjectRequest request,
        ServerCallContext context)
    {
        await projects.Delete(request.Id, context.CancellationToken);
        return new Empty();
    }

    public override async Task<InvitationResponse> InviteMember(
        InviteMemberRequest request,
        ServerCallContext context)
    {
        var invitation = await projects.InviteMember(
            request.ProjectId,
            request.UserId,
            request.InvitedById,
            request.InvitedByUsername,
            context.CancellationToken);

        return await ToInvitationProto(invitation, context.CancellationToken);
    }

    public override async Task<ListInvitationsResponse> ListInvitations(
        ListInvitationsRequest request,
        ServerCallContext context)
    {
        var list = await projects.ListInvitations(request.UserId, context.CancellationToken);
        var response = new ListInvitationsResponse();
        foreach (var invitation in list)
            response.Invitations.Add(await ToInvitationProto(invitation, context.CancellationToken));
        return response;
    }

    public override async Task<ProjectResponse> AcceptInvitation(
        AcceptInvitationRequest request,
        ServerCallContext context)
    {
        var project = await projects.AcceptInvitation(
            request.InvitationId,
            request.UserId,
            context.CancellationToken);
        return ToProto(project);
    }

    public override async Task<Empty> RejectInvitation(
        RejectInvitationRequest request,
        ServerCallContext context)
    {
        await projects.RejectInvitation(request.InvitationId, context.CancellationToken);
        return new Empty();
    }

    private static ProjectResponse ToProto(Project project)
    {
        var response = new ProjectResponse
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            CreatedById = project.CreatedById
        };
        response.MemberIds.AddRange(project.Members.Select(member => member.UserId));
        response.AdminIds.AddRange(project.Members
            .Where(member => member.Role == "admin")
            .Select(member => member.UserId));

        return response;
    }

    private async Task<InvitationResponse> ToInvitationProto(Invitation invitation, CancellationToken cancellationToken)
    {
        var project = await projects.Get(invitation.ProjectId, cancellationToken);
        return new InvitationResponse
        {
            Id = invitation.Id,
            ProjectId = invitation.ProjectId,
            ProjectName = project.Name,
            InvitedById = invitation.InvitedById,
            InvitedByUsername = invitation.InvitedByUsername,
            CreatedAt = Google.Protobuf.WellKnownTypes.Timestamp.FromDateTime(
                DateTime.SpecifyKind(invitation.CreatedAt, DateTimeKind.Utc))
        };
    }
}
