import Iou from '@entities/Iou';
import { DataTypes, Op, Sequelize } from "sequelize";
import IouRequest, { IIouRequestAttributes } from "../entities/IouRequest";
import db from "./DBInstance";

IouRequest.init(
  {
    id: {
      type: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    completed_by: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    proof_of_completion: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    details: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    created_time: {
      type: DataTypes.DATE(),
      allowNull: false,
    },
    completion_time: {
      type: DataTypes.DATE(),
      allowNull: true,
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "requests",
    timestamps: false,
  }
);

export async function getRequest(id: string) {
  return IouRequest.findByPk(id);
}

export interface IRequestsFilter {
  author?: string;
  details?: {
    [Op.substring]: string;
  };
}

export async function getRequests(
  filter: IRequestsFilter,
  start: number = 0,
  limit: number = 25
) {
  return IouRequest.findAll({
    where: filter,
    order: [["created_time", "DESC"]],
    offset: start,
    limit: limit,
  });
}

export async function createRequest(attributes: IIouRequestAttributes) {
  return IouRequest.create(attributes);
}

export async function updateRequest(request: IouRequest, attributes: IIouRequestAttributes) {
  return request.update(attributes);
}

export async function deleteRequest(request: IouRequest) {
  return request.destroy();
}