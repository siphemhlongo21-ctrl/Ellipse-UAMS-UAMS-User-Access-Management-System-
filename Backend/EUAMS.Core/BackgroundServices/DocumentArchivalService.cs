using EUAMS.Shared.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EUAMS.Core.BackgroundServices
{
    public class DocumentArchivalService : BackgroundService
    {
        private static readonly TimeSpan PollInterval = TimeSpan.FromHours(24);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DocumentArchivalService> _logger;

        public DocumentArchivalService(
            IServiceScopeFactory scopeFactory,
            ILogger<DocumentArchivalService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var documentService = scope.ServiceProvider.GetRequiredService<IDocumentService>();

                    var archivedCount = await documentService.ArchiveAllExpiredDocumentsAsync(stoppingToken);

                    if (archivedCount > 0)
                    {
                        _logger.LogInformation("Archived {Count} expired documents.", archivedCount);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Document archival service sweep failed.");
                }

                try
                {
                    await Task.Delay(PollInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    // Shutdown requested
                }
            }
        }
    }
}