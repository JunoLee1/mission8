export interface RegisterDTO {
  nickname: string;
  password: string;
  email: string;
  imageUrl :string
}

export interface LoginDTO {
  password: string;
  email: string;
}
