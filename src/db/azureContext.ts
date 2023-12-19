import {CosmosClient, PartitionKeyKind} from "@azure/cosmos";
import { AbortController } from "node-abort-controller";

export interface IPartitionKey{
    kind: PartitionKeyKind;
    paths: string[];
}

export interface IContainerConfig {
    ContainerId: string;
    PartitionKey: IPartitionKey;
}

export async function create(client:CosmosClient, databaseId:string, containerConfigs:IContainerConfig[]) {

    const controller = new AbortController()

    const { database } = await client.databases.createIfNotExists(
        { id: databaseId },
        { abortSignal: controller.signal}
    );
    controller.abort()

    console.log(`Created database:\n${database.id}\n`);

    for await (const config of containerConfigs) {

        const response = await client.database(databaseId).containers.createIfNotExists(
            { id: config.ContainerId, partitionKey: config.PartitionKey, defaultTtl: -1 },
            { offerThroughput: 400, abortSignal: controller.signal }
        );
        controller.abort()

        console.log(`Created container:\n${response.container.id}\n`);

    }
}


