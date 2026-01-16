import { apiClient } from './api-client'
import type { ApiResponse, Loan, LoanPayment, LoansSummary, LoansByBorrower, LoanStatus, CreateLoanForm, RecordLoanPaymentForm } from '@/types'

export const loanAPI = {
  create: (data: CreateLoanForm) =>
    apiClient.post<ApiResponse<Loan>>('/loans', data),

  getAll: (params?: { status?: LoanStatus; borrowerName?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Loan[]>>('/loans', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Loan>>(`/loans/${id}`),

  recordPayment: (id: string, data: RecordLoanPaymentForm) =>
    apiClient.post<ApiResponse<LoanPayment>>(`/loans/${id}/payments`, data),

  cancel: (id: string) =>
    apiClient.patch<ApiResponse<Loan>>(`/loans/${id}/cancel`),

  getSummary: () =>
    apiClient.get<ApiResponse<LoansSummary>>('/loans/summary'),

  getByBorrower: () =>
    apiClient.get<ApiResponse<LoansByBorrower[]>>('/loans/by-borrower'),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/loans/${id}`),
}
