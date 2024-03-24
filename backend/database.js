const authors = [
    { id: 1, name: "Author 1" },
    { id: 2, name: "Author 2" },
    { id: 3, name: "Author 3" },
]

const books = [
    { id: 1, name: "Book 1", authorId: 1 },
    { id: 2, name: "Book 2", authorId: 1 },
    { id: 3, name: "Book 3", authorId: 2 },
    { id: 4, name: "Book 4", authorId: 2 },
    { id: 5, name: "Book 5", authorId: 3 },
    { id: 6, name: "Book 6", authorId: 3 },
    { id: 7, name: "Book 7", authorId: 3 }
]

module.exports = { authors, books }