export type Movie = {
  id: string;
  title: string;
  posterPath?: string;
};

export interface MessageType {
    _id: string
    text: string
    date: Date
}