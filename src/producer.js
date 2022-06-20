const connector = require('./connector')

module.exports = (exchange, payload) => {

    connector(async channel => {
        await channel.assertExchange(exchange, 'fanout', {durable: false})
        await channel.publish(exchange, '', Buffer.from(JSON.stringify(payload)))
    })
}