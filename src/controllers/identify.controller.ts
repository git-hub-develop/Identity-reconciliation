import { Request, Response } from "express";
import { identifyContact } from "../services/contactService";
import { IdentifyRequestSchema } from "../utils/validation";
import { ApiResponse } from "../utils/types";

export const identify = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = IdentifyRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: validationResult.error.issues,
      });
      return;
    }

    const { email, phoneNumber } = validationResult.data;

    if (!email && !phoneNumber) {
      res.status(400).json({
        error: "At least one of email or phoneNumber must be provided",
      });
      return;
    }

    const consolidatedContact = await identifyContact({
      email,
      phoneNumber: phoneNumber?.toString(),
    });

    const response: ApiResponse = {
      contact: consolidatedContact,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in identify endpoint:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
