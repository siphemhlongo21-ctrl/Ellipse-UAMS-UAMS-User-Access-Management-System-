using EUAMS.Core.Extensions;
using EUAMS.Data;
using EUAMS.Shared.DTOs.RequestApproverAction;
using EUAMS.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EUAMS.Core.Services
{
    public class RequestApproverActionServices : IRequestApproverActionService
    {
        private readonly EuamsDbContext _context;

        public RequestApproverActionServices(EuamsDbContext context)
        {
            _context = context;
        }

        public async Task<List<RequestApproverActionDetails>> GetApproverActionForRequestAsync(int requestId)
        {
            var approvals = await _context.RequestApproverActions.Where(x => x.RequestId == requestId).ToListAsync();

            return approvals.ToListDetails();
        }
    }
}