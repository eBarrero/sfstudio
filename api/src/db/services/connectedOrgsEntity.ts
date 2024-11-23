import ConnectedOrgs, {IConnectedOrgs} from "../schema/ConnectedOrgs"; 


export default class ConnectedOrgsEntity {
    private connectedOrgs: IConnectedOrgs;

    constructor(connectedOrgs: IConnectedOrgs | null) {
        this.connectedOrgs = (!connectedOrgs) ? new ConnectedOrgs() : connectedOrgs;
    }


}


