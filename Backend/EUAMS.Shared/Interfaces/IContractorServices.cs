using EUAMS.Shared.DTOs.Contractor;

namespace EUAMS.Shared.Interfaces
{
    public interface IContractorServices
    {
        Task<ContractorDetails> CreateContractorAsync(ContractorDetails contractorDetails);

        Task<ContractorDetails?> GetContractorByIdAsync(int contractorId);

        Task<ContractorDetails> UpdateContractorAsync(ContractorDetails contractorDetails);

        Task<bool> DeleteContractorAsync(int contractorId);

        /// <summary>Active contractor master records for Line Manager pickers, ordered by company then surname.</summary>
        Task<List<ContractorDetails>> GetActiveContractorsAsync();

    }
}   
