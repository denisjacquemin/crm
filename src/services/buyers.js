// build a Buyers service like DocumentService

let buyerServiceInstance = null;

class BuyerService extends Service {

    constructor(db) {

        super(db);

        this.collection = 'buyers';

        this.fields_white_list = new Set([

            '_id',

            'company_id',

            'name',

            'email',

            'phone',

            'address',

            'created_at',

            'updated_at',

            'created_by_user_id',

        ]);

    }

    static async getInstance() {

        if (!buyerServiceInstance) {

            const db = await mongoService.get();

            buyerServiceInstance = new BuyerService(db);

        }

        return buyerServiceInstance;

    }

}