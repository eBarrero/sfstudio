import controller from '../controller';
import OrgEntity from './orgEntity';
import connectedOrgsFactory from './connectedOrgsFactory';
import { IOrganization } from '../schema/OrganizationSchema';
import dbError from '../dbError';



class OrgFactory {  

    /**
     * @description: find an Organization by organizationId and return an OrgEntity instance
     * @param organizationId - the organizationId of the organization
     * @returns an OrgEntity instance 
     * @throws dbError if the orhanization is not found
     */
    public async findOrgByOrganizationId(organizationId: string): Promise<OrgEntity> {
        try {
            const org = await controller.getOrgByOrganizationBySfId(organizationId);
            if (org) {
                return new OrgEntity(org);
            }
            throw new dbError(`findOrgByOrganizationId(${organizationId}): organization not found`);
        } catch (error) {
            throw new dbError(`findOrgByOrganizationId(${organizationId}): ${(error as Error).message}`);
        }
    }
    /**
     * @description find an organization by url and return an OrgEntity instance
     * @param url - the url of the organization
     * @returns an OrgEntity instance if the organization is found, empty instance otherwise
     */
    public async findOrgByUrl(url: string): Promise<OrgEntity | null> {    
        try {
            const org = await controller.getOrgByUrl(url);
            if (org) {
                return new OrgEntity(org);
            }
            return null;
        } catch (error) {
            throw new dbError(`findOrgByUrl(${url}): ${(error as Error).message}`);
        }
    }


    /**
     * @description create or read an organization and return an OrgEntity instance
     * @param orgData - the data of the organization
     * @returns an OrgEntity instance
     */
    public async upsetOrg(organizationId: string,  orgName: string, instanceUrl: string) : Promise<OrgEntity> { 
        try {
            let org = await controller.getOrgByUrl(instanceUrl);
            if (!org) {
                //const connecetOrgs = await connectedOrgsFactory.upsetConnectedOrgs(organizationId);
                org = await controller.createOrg({organizationId, orgName, instanceUrl});
            }
            return new OrgEntity(org);
        } catch (error) {
            throw new dbError(`upsetOrg(${organizationId}): ${(error as Error).message}`);
        }
    }
}

export default new OrgFactory();