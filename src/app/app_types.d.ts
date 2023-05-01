type User = {
    userId: number,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    token: string,
    imageFilepath: string,
    currentPassword: string // Used for updating users, otherwise null
}

type Category = {
    categoryId: number,
    name: string
}

type AuctionDetails = {
    title: string,
    description: string,
    categoryId:	number,
    sellerId: number,
    endDate: string,
    reserve: number
}

type AuctionOverview = {
    auctionId: number,
    title: string,
    categoryId:	number,
    sellerId: number,
    sellerFirstName: string,
    sellerLastName: string,
    reserve: number,
    numBids: number,
    highestBid: number,
    endDate: string
}

type AuctionListRequest = {
    startIndex?: number,
    count?: number,
    regEx?: string,
    categoryIds?: number[],
    sellerId?: number,
    bidderId?: number,
    sortBy?: string
}

type Bid = {
    bidderId: number,
    amount: number,
    firstName: string,
    lastName: string,
    timestamp: string
}

type ImageAndInfo = {
    imageBytes: string,
    contentType: string
}

export { User, Category, AuctionDetails, AuctionListRequest, AuctionOverview, Bid, ImageAndInfo}