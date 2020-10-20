import { DataTypes } from "sequelize";
import Iou, { IIouAttributes } from "../entities/Iou";
import db from "./DBInstance";
import { v4 as uuid } from "uuid";
import { getBasicUser } from "./Users";
import { getItem } from "./Items";

Iou.init(
  {
    id: {
      type: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    item: {
      type: DataTypes.UUIDV4,
      allowNull: false,
    },
    giver: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    receiver: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    parent_request: {
      type: DataTypes.UUIDV4,
      allowNull: true,
    },
    proof_of_debt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    proof_of_completion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    claimed_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_claimed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  { sequelize: db, tableName: "ious", timestamps: false }
);
export interface IIouFilter {
  giver?: string;
  receiver?: string;
  parent_request?: string;
  is_claimed?: boolean;
  item?: string;
}

export async function getIou(pk: string) {
  return Iou.findByPk(pk);
}

export async function getIous(
  filter?: IIouFilter,
  start: number = 0,
  limit: number = 25
) {
  const ious = await Iou.findAll({
    offset: start,
    limit: limit,
    subQuery: false,
    where: filter,
  });
  // detail user
  for (let iou of ious) {
    iou.item = (await getItem(iou.item as string)) as Object;
    iou.giver = await getBasicUser(iou.giver as string);
    iou.receiver = await getBasicUser(iou.receiver as string);
  }
  return ious;
}

export async function createIouOwed(
  giver: string,
  receiver: string,
  item: string,
  proof: string
) {
  const ious = await Iou.create({
    id: uuid(),
    item: item,
    giver: giver,
    receiver: receiver,
    parent_request: undefined,
    proof_of_debt: proof,
    proof_of_completion: undefined,
    created_time: new Date(),
    claimed_time: undefined,
    is_claimed: false,
  });
  return ious.id;
}

export async function iouExists(iouID: string) {
  return (await Iou.findByPk(iouID)) ? true : false;
}

export async function completeIouOwed(iouID: string, receiver: string) {
  // user that completes must be receiver
  const iou = await Iou.findOne({ where: { id: iouID, receiver: receiver } });
  if (iou === null) {
    return false;
  } else {
    iou
      .update({
        is_claimed: true,
      })
      .then(async () => await Iou.sync({ alter: true }));
  }
  return true;
}

export async function createIou(iou: IIouAttributes) {
  return Iou.create(iou);
}

export async function createIouOwe(
  giver: string,
  receiver: string,
  item: string
) {
  const ious = await Iou.create({
    id: uuid(),
    item: item,
    giver: giver,
    receiver: receiver,
    parent_request: undefined,
    proof_of_debt: undefined,
    proof_of_completion: undefined,
    created_time: new Date(),
    claimed_time: undefined,
    is_claimed: false,
  });
  return ious.id;
}

export async function completeIouOwe(
  iouID: string,
  giver: string,
  proof: string
) {
  // user that completes must be receiver
  const iou = await Iou.findOne({ where: { id: iouID, giver: giver } });
  if (iou === null) {
    return false;
  } else {
    iou
      .update({
        is_claimed: true,
        proof_of_completion: proof,
      })
      .then(async () => await Iou.sync({ alter: true }));
  }
  return true;
}
