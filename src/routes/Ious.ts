import { Request, Response, Router } from "express";
import { BAD_REQUEST, CREATED, OK } from "http-status-codes";
import Joi, { ObjectSchema } from "joi";
import { getAuthenticatedUser } from "@shared/Authenticate";
import {
  createIouOwed,
  completeIouOwed,
  createIouOwe,
  completeIouOwe,
  iouExists,
  getIous,
} from "@daos/Ious";

// Init shared
const router = Router();
interface IIouOwedPOST {
  username: string;
  item: string;
  proof: string;
}
interface IIouOwePOST {
  username: string;
  item: string;
}
interface IIouOweCompletePUT {
  proof: string;
}
const IouOwedPOST: ObjectSchema<IIouOwedPOST> = Joi.object({
  username: Joi.string(),
  item: Joi.string(),
  proof: Joi.string(),
}).options({ presence: "required" });
const IouOwePOST: ObjectSchema<IIouOwePOST> = Joi.object({
  username: Joi.string(),
  item: Joi.string(),
}).options({ presence: "required" });
const IouOweCompletePUT: ObjectSchema<IIouOweCompletePUT> = Joi.object({
  proof: Joi.string(),
}).options({ presence: "required" });

/******************************************************************************
 *                      Get IOUs you are owed - "GET /api/iou/owed"
 ******************************************************************************/

router.get("/owed", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req, res);
  if (user) {
    const iou = await getIous({ receiver: user.username, is_claimed: false });
    return res.status(OK).json({ iou });
  } else {
    return res.status(401).json({
      errors: ["Not authenticated"],
    });
  }
});

/******************************************************************************
 *                      Create IOU you are owed - "POST /api/iou/owed"
 ******************************************************************************/

router.post("/owed", async (req: Request, res: Response) => {
  // Validate request format
  const { error, value } = IouOwedPOST.validate(req.body);
  if (error) {
    return res.status(BAD_REQUEST).json({
      error: [error.message],
    });
  }
  // Get authenticated user
  const user = await getAuthenticatedUser(req, res);
  if (user) {
    // Create new IOU
    const requestBody = value as IIouOwedPOST;
    const iou = await createIouOwed(
      requestBody.username,
      user.username,
      requestBody.item,
      requestBody.proof
    );
    return res.status(OK).json({ iou });
  } else {
    return res.status(401).json({
      errors: ["Not authenticated"],
    });
  }
});

/******************************************************************************
 *                       Mark an IOU as completed - "PUT /api/iou/owed/{iouID}/complete"
 ******************************************************************************/

router.put("/owed/:iouID/complete", async (req: Request, res: Response) => {
  // Get authenticated user
  const user = await getAuthenticatedUser(req, res);
  // if logged in
  if (user) {
    const iouID = req.params.iouID;
    // if IOU exists
    if (await iouExists(iouID)) {
      // if users is receiver of IOU
      if ((await completeIouOwed(iouID, user.username)) == true) {
        return res.status(OK).end();
      } else {
        return res.status(403).json({
          errors: [
            "Not authorised to complete this request (you are not the owner of it)",
          ],
        });
      }
    } else {
      return res.status(404).json({
        errors: ["Not found (did you mean to use the /owe endpoint)"],
      });
    }
  } else {
    return res.status(401).json({
      errors: ["Not authenticated"],
    });
  }
});

/******************************************************************************
 *                      Get IOUs you owe - "GET /api/iou/owe"
 ******************************************************************************/

router.get("/owe", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req, res);
  if (user) {
    const iou = await getIous({ giver: user.username, is_claimed: false });
    return res.status(OK).json({ iou });
  } else {
    return res.status(401).json({
      errors: ["Not authenticated"],
    });
  }
});

/******************************************************************************
 *                      Create IOU you owe - "POST /api/iou/owe"
 ******************************************************************************/
router.post("/owe", async (req: Request, res: Response) => {
  // Validate request format
  const { error, value } = IouOwePOST.validate(req.body);
  if (error) {
    return res.status(BAD_REQUEST).json({
      error: [error.message],
    });
  }
  // Get authenticated user
  const user = await getAuthenticatedUser(req, res);
  if (user) {
    // Create new IOU
    const requestBody = value as IIouOwePOST;
    const iou = await createIouOwe(
      user.username,
      requestBody.username,
      requestBody.item
    );
    return res.status(OK).json({ iou });
  } else {
    return res.status(401).json({
      errors: ["Not authenticated"],
    });
  }
});

/******************************************************************************
 *                       Mark an IOU as completed - "PUT /api/iou/owe/{iouID}/complete"
 ******************************************************************************/

router.put("/owe/:iouID/complete", async (req: Request, res: Response) => {
  // Validate request format
  const { error, value } = IouOweCompletePUT.validate(req.body);
  if (error) {
    return res.status(BAD_REQUEST).json({
      error: [error.message],
    });
  }
  // Get authenticated user
  const user = await getAuthenticatedUser(req, res);
  // if logged in
  if (user) {
    const iouID = req.params.iouID;
    const requestBody = value as IIouOweCompletePUT;
    // if IOU exists
    if (await iouExists(iouID)) {
      // if users is receiver of IOU
      if (
        (await completeIouOwe(iouID, user.username, requestBody.proof)) == true
      ) {
        return res.status(OK).end();
      } else {
        return res.status(403).json({
          errors: [
            "Not authorised to complete this request (you are not the owner of it)",
          ],
        });
      }
    } else {
      return res.status(404).json({
        errors: ["Not found (did you mean to use the /owed endpoint)"],
      });
    }
  } else {
    return res.status(401).json({
      errors: ["Not authenticated"],
    });
  }
});

/******************************************************************************
 *                                     Export
 ******************************************************************************/

export default router;
