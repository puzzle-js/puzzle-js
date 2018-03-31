export interface IFragment {
    name: string;
}

export interface FragmentMap {
    [name: string]: Fragment;
}


export class Fragment {
    public name: string;

    constructor(config: IFragment) {
        this.name = config.name;
    }
}