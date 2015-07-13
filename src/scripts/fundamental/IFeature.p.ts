export interface IFeature {
    name();
    inject(...args);
    initialize(...args);
}

