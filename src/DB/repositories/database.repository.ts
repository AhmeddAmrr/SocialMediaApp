import { CreateOptions, DeleteResult, HydratedDocument, Model, MongooseUpdateQueryOptions, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery, Types, UpdateQuery, UpdateWriteOpResult } from "mongoose";



export abstract class DatabaseRepository<TDocument> {


    constructor(protected readonly model: Model<TDocument>) { }


    async findOne({
        filter,
        select,
        options
    }: {
        filter?: RootFilterQuery<TDocument>
        select?: ProjectionType<TDocument> | null
        options?: QueryOptions<TDocument> | null
    }): Promise<any | HydratedDocument<TDocument> | null> {
        const doc = this.model.findOne(filter , select , options);
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }

        return await doc.exec();
    }
    async find({
        filter,
        select,
        options
    }: {
        filter?: RootFilterQuery<TDocument>
        select?: ProjectionType<TDocument> | undefined
        options?: QueryOptions<TDocument> | undefined
    }): Promise<any | HydratedDocument<TDocument>[] | []> {
        const doc = this.model.find(filter || {}).select(select || "")
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        if (options?.limit) {
            doc.limit(options.limit);
        }
        if (options?.skip) {
            doc.skip(options.skip);
        }

        return await doc.exec();
    }

    async paginate({
        filter = {},
        select = {},
        options = {},
        page = 1,
        size = 5,
    }: {
        filter?: RootFilterQuery<TDocument>;
        select?: ProjectionType<TDocument> | undefined;
        options?: QueryOptions<TDocument> | undefined;
        page?: number;
        size?: number;
    }) {
        let docsCount : number | undefined = undefined;
        let pages : number | undefined = undefined;
        page = Math.floor(page < 1 ? 1 : page);
        options.limit = Math.floor(size < 1 || !size ? 5 : size);
        options.skip = (page - 1) * size;
        docsCount = await this.model.countDocuments(filter);
        pages = Math.ceil(docsCount / options.limit)
        const results = await this.find({ filter, select, options })
        return await {
            docsCount,
            pages,
            limit : options.limit,
            currentPage: page,
            results,
        }
    }

    async findOneAndUpdate({
        filter,
        update,
        options = { new: true },
    }: {
        filter: RootFilterQuery<TDocument>;
        update: UpdateQuery<TDocument>;
        options?: QueryOptions<TDocument> | null
    }): Promise<any | HydratedDocument<TDocument> | null> {
        const doc = this.model.findOneAndUpdate(filter, update)
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }

        return await doc.exec();
    }

    async findById({
        id,
        select,
        options
    }: {
        id: Types.ObjectId;
        select?: ProjectionType<TDocument> | null
        options?: QueryOptions<TDocument> | null
    }): Promise<any | HydratedDocument<TDocument> | null> {
        const doc = this.model.findOne(id).select(select || "")
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }

        return await doc.exec();
    }

    async create({
        data,
        options
    }: {
        data: Partial<TDocument>[],
        options?: CreateOptions | undefined
    }): Promise<HydratedDocument<TDocument>[] | undefined> {
        return await this.model.create(data, options);
    }

    async insertMany({
        data,
    }: {
        data: Partial<TDocument>[],

    }): Promise<HydratedDocument<TDocument>[]> {
        return await this.model.insertMany(data) as HydratedDocument<TDocument>[];
    }

    async updateOne({
        filter,
        update,
        options,

    }: {
        filter: RootFilterQuery<TDocument>;
        update: UpdateQuery<TDocument>;
        options?: MongooseUpdateQueryOptions<TDocument> | null;
    }): Promise<UpdateWriteOpResult> {
        if (Array.isArray(update)) {
            update.push({
                $set: {
                    __v: { $add: ["$__v", 1] },
                }
            });
            return await this.model.updateOne(
                filter,
                update,
                options
            );
        }
        return await this.model.updateOne(
            filter,
            { ...update, $inc: { __v: 1 } },
            options
        );
    }

    async deleteOne({
        filter,

    }: {
        filter: RootFilterQuery<TDocument>;

    }): Promise<DeleteResult> {
        return await this.model.deleteOne(
            filter,
        );
    }
    async deleteMany({
        filter,

    }: {
        filter: RootFilterQuery<TDocument>;

    }): Promise<DeleteResult> {
        return await this.model.deleteMany(
            filter,
        );
    }

    async findOneAndDelete({
        filter,

    }: {
        filter: RootFilterQuery<TDocument>;

    }): Promise<HydratedDocument<TDocument> | null> {
        return await this.model.findOneAndDelete(filter);
    }




} 