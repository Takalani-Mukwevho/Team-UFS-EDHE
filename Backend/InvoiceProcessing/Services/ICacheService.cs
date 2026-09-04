using InvoiceProcessing.Models;

namespace InvoiceProcessing.Services;

public interface ICacheService
{
    Task<ExtractionCache?> GetByHashAsync(string documentHash);
    Task<ExtractionCache?> GetByKeyAsync(string cacheKey);
    Task SaveAsync(ExtractionCache cacheEntry);
    Task UpdateAsync(ExtractionCache cacheEntry);
    Task DeleteAsync(string cacheKey);
}
