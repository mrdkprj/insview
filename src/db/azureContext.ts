import {CosmosClient, PartitionKeyKind} from "@azure/cosmos";

export interface IPartitionKey{
    kind: PartitionKeyKind;
    paths: string[];
}

export interface IContainerConfig {
    ContainerId: string;
    PartitionKey: IPartitionKey;
}

export async function create(client:CosmosClient, databaseId:string, containerConfigs:IContainerConfig[]) {

    const { database } = await client.databases.createIfNotExists({
        id: databaseId
    });

    console.log(`Created database:\n${database.id}\n`);

    for await (const config of containerConfigs) {

        const response = await client.database(databaseId).containers.createIfNotExists(
            { id: config.ContainerId, partitionKey: config.PartitionKey, defaultTtl: -1 },
            { offerThroughput: 400 }
        );

        console.log(`Created container:\n${response.container.id}\n`);

    }
}


