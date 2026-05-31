// lib/customerService.js
import { safeExecute } from './dbHelpers.js';

/**
 * Create customer
 */
export async function createCustomer(data) {
  if (!data?.name) throw new Error('name is required');
  if (!data?.address1) throw new Error('address1 is required');
  if (!data?.city) throw new Error('city is required');
  if (!data?.state) throw new Error('state is required');
  if (!data?.mobile) throw new Error('mobile is required');
  if (!data?.pincode) throw new Error('pincode is required');

  return safeExecute((prisma) =>
    prisma.customer.create({
      data: {
        name: data.name,
        address1: data.address1,
        address2: data.address2 ?? null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        mobile: data.mobile,
        email: data.email ?? null,
        gstnNumber: data.gstnNumber ?? null,
        remarks: data.remarks ?? null,
        preferredPaymentMethod: data.preferredPaymentMethod ?? null,
        paymentTerms: data.preferredPaymentTerms ?? data.paymentTerms ?? null,
      },
    })
  );
}

/**
 * Get all customers (optional search)
 */
export async function getAllCustomers(filters = {}) {
  return safeExecute((prisma) =>
    prisma.customer.findMany({
      where: {
        ...(filters.name
          ? { name: { contains: filters.name, mode: 'insensitive' } }
          : {}),
        ...(filters.mobile ? { mobile: filters.mobile } : {}),
        ...(filters.gstnNumber ? { gstnNumber: filters.gstnNumber } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })
  );
}

/**
 * Get customer by ID
 */
export async function getCustomerById(id) {
  if (!id) throw new Error('id is required');

  return safeExecute((prisma) =>
    prisma.customer.findUnique({
      where: { id },
    })
  );
}

/**
 * Update customer
 */
export async function updateCustomer(id, data) {
  if (!id) throw new Error('id is required');

  const updateData = {};
  if ('name' in data) updateData.name = data.name;
  if ('address1' in data) updateData.address1 = data.address1;
  if ('address2' in data) updateData.address2 = data.address2 ?? null;
  if ('city' in data) updateData.city = data.city;
  if ('state' in data) updateData.state = data.state;
  if ('pincode' in data) updateData.pincode = data.pincode;
  if ('mobile' in data) updateData.mobile = data.mobile;
  if ('email' in data) updateData.email = data.email ?? null;
  if ('gstnNumber' in data) updateData.gstnNumber = data.gstnNumber ?? null;
  if ('remarks' in data) updateData.remarks = data.remarks ?? null;
  if ('preferredPaymentMethod' in data)
    updateData.preferredPaymentMethod = data.preferredPaymentMethod ?? null;
  if ('preferredPaymentTerms' in data || 'paymentTerms' in data)
    updateData.paymentTerms = data.preferredPaymentTerms ?? data.paymentTerms ?? null;

  return safeExecute((prisma) =>
    prisma.customer.update({
      where: { id },
      data: updateData,
    })
  );
}

/**
 * Delete customer
 */
export async function deleteCustomer(id) {
  if (!id) throw new Error('id is required');

  return safeExecute((prisma) =>
    prisma.customer.delete({
      where: { id },
    })
  );
}
