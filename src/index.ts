import app from './app';

app.listen(app.get('port'), () => {
    console.log(`got to http://localhost:${app.get('port')}/api`);
});
