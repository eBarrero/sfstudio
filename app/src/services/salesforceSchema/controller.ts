import { apiClient } from '../http/apiClient';

export interface SalesforceGlobalDescribeResponse {
  sobjects: Salesforce_SObject[];
}

export interface SalesforceQueryResponse {
  done: boolean;
  totalSize: number;
  records: Record<string, unknown>[];
  limit: number;
}

export interface MetadataFieldResponse {
  name: string;
  description: string;
}

export function getDescribe(orgKey: string): Promise<SalesforceGlobalDescribeResponse> {
  return apiClient.request(`describeGlobal/${encodeURIComponent(orgKey)}`, { legacy: true });
}

export function getDescribeObject(orgKey: string, sObject: string): Promise<Salesforce_SObject> {
  return apiClient.request(`describe/${encodeURIComponent(orgKey)}/${encodeURIComponent(sObject)}`, { legacy: true });
}

export function getMetadataObject(orgKey: string, sObject: string): Promise<MetadataFieldResponse[]> {
  return apiClient.request(`getObjectmetadata/${encodeURIComponent(orgKey)}/${encodeURIComponent(sObject)}`, { legacy: true });
}

export function sendQuery(orgKey: string, query: string, limit = 200): Promise<SalesforceQueryResponse> {
  return apiClient.request('query', { method: 'POST', body: { orgKey, query, limit } });
}
