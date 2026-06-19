FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /build
COPY . .
RUN dotnet restore services/ProjectService/ProjectService/ProjectService.csproj
RUN dotnet publish services/ProjectService/ProjectService/ProjectService.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5002
ENV ASPNETCORE_URLS=http://+:5002
ENTRYPOINT ["dotnet", "ProjectService.dll"]
