## Branching strategy
* Create a feature banch
* Add your changes
* Create a pull request to many branch
* Check for pull request comments

## Add migrations command

After making database changes, run the following command to add migrations for the changes you have made.

```bat
dotnet ef migrations add <your-migrations-name> --project ..\Ellipse.Data\ --startup-project  ..\Ellipse.API\
```

## Update database command

If you want to update the database, you must run the following command

```bat
dotnet ef database update --project ..\Ellipse.Data\ --startup-project  ..\Ellipse.API\
```

## Notes 

To run EF commands use the Terminal

Before you run the EF commands for the first time, please run the following command

```bat
dotnet tool install --global dotnet-ef
```

Make sure you are in the Ellipse.Data directory whenever you run commands for the database. 

```bat
cd .\Ellipse.Data\
```

## Run Swagger locally (Development)
1. Open/run Ellipse.API
2. Use launch profile https
    - CLI: dotnet run --launch-profile https
3. Open:
    - Swagger UI: https://localhost:7093/swagger
    - OpenAPI JSON: https://localhost:7093/openapi/v1.json
4. If browser says connection refused, confirm terminal shows:
    - Now listening on: https://localhost:7093
5. Swagger is enabled only when ASPNETCORE_ENVIRONMENT=Development
    - Optional one-liner:
    “Not secure in browser is expected for local HTTPS dev cert.”

## Run frontend (ellipse-frontend)

```bat
dotnet run --project Ellipse.API --launch-profile http
cd ellipse-frontend
npm install
npm run dev
```

- UI: http://localhost:5173  
- API (proxied as `/api`): http://localhost:5190  
- Login username is sent as `X-AD-Username` in Development (default `DEV\ellipse.dev`).  
- Details: [ellipse-frontend/README.md](ellipse-frontend/README.md)

## Deploy on Windows Server (IIS)

See [docs/deploy/iis-windows-server.md](docs/deploy/iis-windows-server.md).

```powershell
.\scripts\publish-for-iis.ps1 -PublicUrl https://ellipse.your.gov
```