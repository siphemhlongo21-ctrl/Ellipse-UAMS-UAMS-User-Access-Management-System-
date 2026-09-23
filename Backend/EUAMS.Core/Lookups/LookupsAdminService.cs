using EUAMS.Data;
using EUAMS.Data.Entities;
using EUAMS.Shared.DTOs.Lookups;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EUAMS.Core.Lookups
{
    /// <summary>Admin CRUD for Department/Branch/RequestType/EllipsePosition lookups (US-031).</summary>
    public class LookupsAdminService : ILookupsAdminService
    {
        private readonly EuamsDbContext _db;

        public LookupsAdminService(EuamsDbContext db)
        {
            _db = db;
        }

        public async Task<List<RequestTypeDetails>> GetRequestTypesAsync(CancellationToken cancellationToken = default)
        {
            return await _db.RequestTypes.AsNoTracking()
                .OrderBy(rt => rt.Name)
                .Select(rt => new RequestTypeDetails { Id = rt.Id, Code = rt.Code, Name = rt.Name, IsActive = rt.IsActive })
                .ToListAsync(cancellationToken);
        }

        public async Task<RequestTypeDetails> CreateRequestTypeAsync(RequestTypeDetails details, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(details.Code) || string.IsNullOrWhiteSpace(details.Name))
            {
                throw new ArgumentException("Code and Name are required.");
            }

            var code = details.Code.Trim();
            var name = details.Name.Trim();
            if (await _db.RequestTypes.AnyAsync(rt => rt.Code == code, cancellationToken))
            {
                throw new InvalidOperationException($"RequestType '{code}' already exists.");
            }

            var entity = new RequestType { Code = code, Name = name, IsActive = details.IsActive };
            _db.RequestTypes.Add(entity);
            await _db.SaveChangesAsync(cancellationToken);

            return new RequestTypeDetails { Id = entity.Id, Code = entity.Code, Name = entity.Name, IsActive = entity.IsActive };
        }

        public async Task<RequestTypeDetails> UpdateRequestTypeAsync(RequestTypeDetails details, CancellationToken cancellationToken = default)
        {
            var entity = await _db.RequestTypes.FirstOrDefaultAsync(rt => rt.Id == details.Id, cancellationToken)
                ?? throw new KeyNotFoundException($"RequestType {details.Id} was not found.");

            if (string.IsNullOrWhiteSpace(details.Code) || string.IsNullOrWhiteSpace(details.Name))
            {
                throw new ArgumentException("Code and Name are required.");
            }

            var code = details.Code.Trim();
            var name = details.Name.Trim();
            if (await _db.RequestTypes.AnyAsync(rt => rt.Id != details.Id && rt.Code == code, cancellationToken))
            {
                throw new InvalidOperationException($"RequestType '{code}' already exists.");
            }

            entity.Code = code;
            entity.Name = name;
            entity.IsActive = details.IsActive;
            await _db.SaveChangesAsync(cancellationToken);

            return new RequestTypeDetails { Id = entity.Id, Code = entity.Code, Name = entity.Name, IsActive = entity.IsActive };
        }
    }
}
