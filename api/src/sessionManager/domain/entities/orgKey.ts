/** Stable identity of a Salesforce organization as seen by one Salesforce user. */
export type OrgKey = string & { readonly __orgKey: unique symbol };

const salesforceId = /^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$/;

export function createOrgKey(organizationId: string, userId: string): OrgKey {
    if (!salesforceId.test(organizationId) || !salesforceId.test(userId)) {
        throw new Error('Invalid Salesforce identity');
    }
    return `${organizationId}:${userId}` as OrgKey;
}

export function parseOrgKey(value: string): { organizationId: string; userId: string } {
    const parts = value.split(':');
    if (parts.length !== 2) throw new Error('Invalid OrgKey');
    createOrgKey(parts[0], parts[1]);
    return { organizationId: parts[0], userId: parts[1] };
}
