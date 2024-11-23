import controller from "../controller";
import ConnectedOrgsEntity from "./connectedOrgsEntity";
import { IConnectedOrgs } from "../schema/ConnectedOrgs";
import dbError from "../dbError";


class ConnectedOrgsFactory {
    /**
     * @description find a connectedOrgs by id and return an ConnectedOrgsEntity instance
     * @param id - the id of the connectedOrgs in string format
     * @returns an ConnectedOrgsEntity instance if the connectedOrgs is found, empty instance otherwise
     */
    public async findConnectedOrgsByName(name: string): Promise<ConnectedOrgsEntity | null> {    
        try {
            const connectedOrgs = await controller.getConnectedOrgsByName(name);
            if (connectedOrgs) {
                return new ConnectedOrgsEntity(connectedOrgs);
            }
            return null;
        } catch (error) {
            throw new dbError(`findConnectedOrgsById(${name}): ${(error as Error).message}`);
        }
    }

    /**
     * @description create or read a connectedOrgs and return an ConnectedOrgsEntity instance
     * @param connectedOrgsData - the data of the connectedOrgs
     * @returns an ConnectedOrgsEntity instance
     */
    public async upsetConnectedOrgs(organizationName: string): Promise<ConnectedOrgsEntity> {
        try {
            let connectedOrgs = await controller.getConnectedOrgsByName(organizationName);
            if (!connectedOrgs) {
                connectedOrgs = await controller.createConnectedOrgs(organizationName);
            }
            return new ConnectedOrgsEntity(connectedOrgs);
        } catch (error) {
            throw new dbError(`upsetConnectedOrgs(${organizationName}): ${(error as Error).message}`);
        }
    }
}

export default new ConnectedOrgsFactory();

