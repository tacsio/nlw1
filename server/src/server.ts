import express from 'express';

const app = express();

app.get('/users', (request, response) => {
	response.json(
		['User1', 'User2']
	)
});

app.listen(3333);