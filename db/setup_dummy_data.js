require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");
const faker = require("faker");

const mongoDbUrl = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}`;
const client = new MongoClient(mongoDbUrl, { useNewUrlParser: true });

async function generateDummyData() {
    try {
        await client.connect();
        const db = client.db();

        // Generate dummy data for companies collection
        const companies = [];
        for (let i = 0; i < 10; i++) {
            const company = {
                name: faker.company.companyName(),
                description: faker.company.catchPhrase(),
                address: faker.address.streetAddress(),
                phone_number: faker.phone.phoneNumber(),
                email: faker.internet.email(),
                website: faker.internet.url()
            };
            companies.push(company);
        }
        const insertedCompanies = await db.collection("companies").insertMany(companies);

        // Generate dummy data for users collection with foreign keys to companies
        const users = [];
        for (let i = 0; i < 20; i++) {
            const user = {
                email: faker.internet.email(),
                language: faker.random.locale(),
                timezone: faker.random.arrayElement(faker.definitions.time_zone),
                google_id: faker.random.uuid(),
                picture: faker.internet.avatar(),
                companies: [insertedCompanies.ops[faker.random.number({ min: 0, max: insertedCompanies.ops.length - 1 })]._id],
                resetPasswordExpires: faker.date.future().getTime(),
                resetPasswordToken: faker.random.uuid()
            };
            users.push(user);
        }
        const insertedUsers = await db.collection("users").insertMany(users);

        // Generate dummy data for documents collection with foreign keys to users and companies
        const documents = [];
        for (let i = 0; i < 50; i++) {
            const document = {
                company_id: insertedCompanies.ops[faker.random.number({ min: 0, max: insertedCompanies.ops.length - 1 })]._id,
                config: {
                    field1: faker.lorem.word(),
                    field2: faker.random.number(),
                    field3: faker.date.recent()
                },
                created_at: faker.date.past(),
                created_by_user_id: insertedUsers.ops[faker.random.number({ min: 0, max: insertedUsers.ops.length - 1 })]._id,
                updated_at: faker.date.recent()
            };
            documents.push(document);
        }
        await db.collection("documents").insertMany(documents);

        console.log("Dummy data generated successfully!");
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

generateDummyData();