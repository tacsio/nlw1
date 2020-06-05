import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

export default {
	storage: multer.diskStorage({
		destination: path.resolve(__dirname, '..', '..', 'uploads', 'user'),
		filename: (requesq, file, callback) => {
			const hash = crypto.randomBytes(8).toString('hex');
			const fileName = `${hash}_${file.originalname}`;

			callback(null, fileName);
		}
	})
}