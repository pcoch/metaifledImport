import "@shopify/shopify-api/adapters/node";
import { shopifyApi, ApiVersion, Session } from "@shopify/shopify-api";
import { config } from "dotenv";
import fs from "fs";

// Load environment variables from .env file
config();

//Configure Shopify API
const shopify = shopifyApi({
  apiSecretKey: process.env.API_SECRET_KEY,
  apiVersion: ApiVersion.July24, //Update to the latest API version
  isCustomStoreApp: true,
  adminApiAccessToken: process.env.ADMIN_API_ACCESS_TOKEN,
  isEmbeddedApp: false,
  hostName: "paulcochrane.myshopify.com", // Update with your store name
});

// Initialize session with required properties
const session = shopify.session.customAppSession(process.env.HOST_NAME);
const client = new shopify.clients.Graphql({ session });

async function createMetafields() {
  // Read data from data.json file
  const jsonData = fs.readFileSync("data.json", "utf-8");
  const parsedData = JSON.parse(jsonData);

  // Access edges directly
  const edges = parsedData.data.metafieldDefinitions.edges;

  // Create metafield definitions
  for (const { node } of edges) {
    try {
      const response = await client.request(
        `#graphql
            mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
            metafieldDefinitionCreate(definition: $definition) {
              createdDefinition {
                id
                name
              }
              userErrors {
                message
                code
              }
            }
          }`,
        {
          variables: {
            definition: {
              name: node.name,
              namespace: node.namespace,
              key: node.key,
              description: node.description,
              type: node.type.name,
              ownerType: node.ownerType,
            },
          },
        }
      );

      // Log the response
      console.dir(response, { depth: null, colors: true });

      // Check for user errors
      if (response.metafieldDefinitionCreate.userErrors.length > 0) {
        console.error(
          "User Errors:",
          response.metafieldDefinitionCreate.userErrors
        );
      }

      // Delay for 5 seconds
      await delay(5000);
    } catch (error) {
      console.error("Error creating metafield definition:", error);
    }
  }
}

// Helper function to introduce a delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Example usage
(async () => {
  await createMetafields();
})();
