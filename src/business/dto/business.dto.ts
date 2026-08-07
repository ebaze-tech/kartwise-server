export class BusinessDto {
  id!: string;
  name!: string;
  description!: string;
  ownerId!: string;
  emailAddress!: string;
  phoneNumber!: string;
  address!: string;
  categoryId!: string;
  createdAt!: Date;
  updatedAt!: Date;
  category!: {
    id: string;
    name: string;
    description: string;
  };
}


