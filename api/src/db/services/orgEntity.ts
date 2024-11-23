


export interface IOrganizationEntity {
    organizationId: string;
    orgName: string;
    instanceUrl: string;
    connectedOrgsName: string;    
}


export default class OrgEntity {
    private org: IOrganizationEntity;

    constructor(org: IOrganizationEntity) {
        this.org = org;
    }


    /**
     * @description: returns the current organization record
     * @returns {IOrganization}
     */
    public getRecord(): IOrganizationEntity {
        return this.org;
    }

    
}
