using InvoiceProcessing.Functions;

namespace InvoiceProcessing;

public class Program
{
    public static void Main(string[] args)
    {
        Console.WriteLine("Invoice Processing Lambda Functions");
        Console.WriteLine("====================================");
        Console.WriteLine("Available functions:");
        Console.WriteLine("  - UploadFunction: Process invoice uploads");
        Console.WriteLine("  - VerifyFunction: Verify invoices");
        Console.WriteLine("  - FundFunction: Make funding decisions");
        Console.WriteLine("  - DemoFunction: Run end-to-end demo");
        Console.WriteLine();
        Console.WriteLine("Deploy these functions using AWS Lambda or SAM CLI.");
    }
}
