export interface IFragment {
    name: string;
}

export class Fragment {
    public name: string;

    constructor(config: IFragment) {
        this.name = config.name;
    }
}