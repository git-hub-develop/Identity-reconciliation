import request from "supertest";
import app from "../src/app";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

describe("Contact Identity Reconciliation Tests", () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.contact.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Scenario 1: New Customer (No existing contacts)", () => {
    test("Should create new primary contact with email only", async () => {
      const response = await request(app).post("/api/identify").send({
        email: "john@example.com",
      });

      expect(response.status).toBe(200);
      expect(response.body.contact).toMatchObject({
        primaryContatctId: expect.any(Number),
        emails: ["john@example.com"],
        phoneNumbers: [],
        secondaryContactIds: [],
      });
    });

    test("Should create new primary contact with phone only", async () => {
      const response = await request(app).post("/api/identify").send({
        phoneNumber: "1234567890",
      });

      expect(response.status).toBe(200);
      expect(response.body.contact).toMatchObject({
        primaryContatctId: expect.any(Number),
        emails: [],
        phoneNumbers: ["1234567890"],
        secondaryContactIds: [],
      });
    });

    test("Should create new primary contact with both email and phone", async () => {
      const response = await request(app).post("/api/identify").send({
        email: "john@example.com",
        phoneNumber: "1234567890",
      });

      expect(response.status).toBe(200);
      expect(response.body.contact).toMatchObject({
        primaryContatctId: expect.any(Number),
        emails: ["john@example.com"],
        phoneNumbers: ["1234567890"],
        secondaryContactIds: [],
      });
    });
  });

  describe("Scenario 2: Existing Customer - Same Information", () => {
    test("Should return existing contact when exact match found", async () => {
      // First request - creates new contact
      const firstResponse = await request(app).post("/api/identify").send({
        email: "lorraine@hillvalley.edu",
        phoneNumber: "123456",
      });

      // Second request - same information
      const secondResponse = await request(app).post("/api/identify").send({
        email: "lorraine@hillvalley.edu",
        phoneNumber: "123456",
      });

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.contact).toEqual(firstResponse.body.contact);
      expect(secondResponse.body.contact.secondaryContactIds).toHaveLength(0);
    });
  });

  describe("Scenario 3: Existing Customer - New Information", () => {
    test("Should create secondary contact when phone matches but email is new", async () => {
      // First request
      await request(app).post("/api/identify").send({
        email: "lorraine@hillvalley.edu",
        phoneNumber: "123456",
      });

      // Second request - same phone, new email
      const response = await request(app).post("/api/identify").send({
        email: "mcfly@hillvalley.edu",
        phoneNumber: "123456",
      });

      expect(response.status).toBe(200);
      expect(response.body.contact).toMatchObject({
        primaryContatctId: expect.any(Number),
        emails: ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
        phoneNumbers: ["123456"],
        secondaryContactIds: expect.arrayContaining([expect.any(Number)]),
      });
      expect(response.body.contact.secondaryContactIds).toHaveLength(1);
    });

    test("Should create secondary contact when email matches but phone is new", async () => {
      // First request
      await request(app).post("/api/identify").send({
        email: "john@example.com",
        phoneNumber: "1111111111",
      });

      // Second request - same email, new phone
      const response = await request(app).post("/api/identify").send({
        email: "john@example.com",
        phoneNumber: "2222222222",
      });

      expect(response.status).toBe(200);
      expect(response.body.contact).toMatchObject({
        primaryContatctId: expect.any(Number),
        emails: ["john@example.com"],
        phoneNumbers: ["1111111111", "2222222222"],
        secondaryContactIds: expect.arrayContaining([expect.any(Number)]),
      });
    });
  });

  describe("Scenario 4: Linking Separate Primary Contacts", () => {
    test("Should link two separate primary contacts when they belong to same person", async () => {
      // Create first primary contact
      const first = await request(app).post("/api/identify").send({
        email: "george@hillvalley.edu",
        phoneNumber: "919191",
      });

      // Create second primary contact
      const second = await request(app).post("/api/identify").send({
        email: "biffsucks@hillvalley.edu",
        phoneNumber: "717171",
      });

      // Link them with a request that has info from both
      const linkingResponse = await request(app).post("/api/identify").send({
        email: "george@hillvalley.edu",
        phoneNumber: "717171",
      });

      expect(linkingResponse.status).toBe(200);
      expect(linkingResponse.body.contact).toMatchObject({
        primaryContatctId: first.body.contact.primaryContatctId, // Should be the older one
        emails: expect.arrayContaining([
          "george@hillvalley.edu",
          "biffsucks@hillvalley.edu",
        ]),
        phoneNumbers: expect.arrayContaining(["919191", "717171"]),
        secondaryContactIds: expect.arrayContaining([
          second.body.contact.primaryContatctId,
        ]),
      });
    });
  });

  describe("Scenario 5: Edge Cases and Validation", () => {
    test("Should reject request with no email or phone", async () => {
      const response = await request(app).post("/api/identify").send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test("Should reject request with invalid email", async () => {
      const response = await request(app).post("/api/identify").send({
        email: "invalid-email",
        phoneNumber: "1234567890",
      });

      expect(response.status).toBe(400);
    });

    test("Should handle null values correctly", async () => {
      const response = await request(app).post("/api/identify").send({
        email: null,
        phoneNumber: "1234567890",
      });

      expect(response.status).toBe(200);
      expect(response.body.contact.emails).toEqual([]);
      expect(response.body.contact.phoneNumbers).toEqual(["1234567890"]);
    });

    test("Should handle phoneNumber as number", async () => {
      const response = await request(app).post("/api/identify").send({
        email: "test@example.com",
        phoneNumber: 1234567890,
      });

      expect(response.status).toBe(200);
      expect(response.body.contact.phoneNumbers).toEqual(["1234567890"]);
    });
  });

  describe("Scenario 6: Exact Example from Requirements", () => {
    test("Should match the exact example from requirements", async () => {
      // First order
      await request(app).post("/api/identify").send({
        email: "lorraine@hillvalley.edu",
        phoneNumber: "123456",
      });

      // Second order - creates secondary
      const response = await request(app).post("/api/identify").send({
        email: "mcfly@hillvalley.edu",
        phoneNumber: "123456",
      });

      expect(response.status).toBe(200);
      expect(response.body.contact).toMatchObject({
        primaryContatctId: expect.any(Number),
        emails: ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
        phoneNumbers: ["123456"],
        secondaryContactIds: expect.arrayContaining([expect.any(Number)]),
      });

      // All these requests should return the same response
      const testRequests = [
        { email: null, phoneNumber: "123456" },
        { email: "lorraine@hillvalley.edu", phoneNumber: null },
        { email: "mcfly@hillvalley.edu", phoneNumber: null },
        { email: "mcfly@hillvalley.edu", phoneNumber: "123456" },
      ];

      for (const testReq of testRequests) {
        const testResponse = await request(app)
          .post("/api/identify")
          .send(testReq);

        expect(testResponse.body.contact).toEqual(response.body.contact);
      }
    });
  });
});
