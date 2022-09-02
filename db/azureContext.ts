import {CosmosClient} from "@azure/cosmos";

export interface IPartitionKey{
    kind: string,
    paths: string[],
}

export interface IContainerConfig {
    ContainerId: string,
    PartitionKey: IPartitionKey,
}
/*
// This script ensures that the database is setup and populated correctly
*/
export async function create(client:CosmosClient, databaseId:string, containerConfigs:IContainerConfig[]) {

    /**
     * Create the database if it does not exist
     */
    const { database } = await client.databases.createIfNotExists({
        id: databaseId
    });
    console.log(`Created database:\n${database.id}\n`);

    /**
     * Create the container if it does not exist
     */
     for await (let config of containerConfigs) {
        const response = await client.database(databaseId).containers.createIfNotExists(
            { id: config.ContainerId, partitionKey: config.PartitionKey, defaultTtl: -1 },
            { offerThroughput: 400 }
        );

        console.log(`Created container:\n${response.container.id}\n`);
    }
}


