export class BusinessCategoriesDto {
  id: string;
  name: string;
  description: string;
  businesses: {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    emailAddress: string;
    phoneNumber: string;
    address: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
}
