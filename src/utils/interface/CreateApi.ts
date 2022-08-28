export default interface CreateApi {
  project: string;
  properties: Properties;
  spec: Spec[];
}

export interface Properties {
    author: string;
    repoUrl: string;
    packages: Packages;
    variables: Variables;
}

export interface Spec {
    name: string;
    path: string;
    method: string;
    return: string;
}

export interface Variables {
    service: Service;
    local: { [x: string]: string };
}

export interface Service {
    ENVIRONMENT: string;
    PORT: string;
    ERROR_LOG_DIR: string
}

export interface Packages {
    dependencies: string[];
    devDependencies: string[];
}