
const { PrismaClient } = require("@prisma/client");
const consumer = require("./src/consumer");
const producer = require("./src/producer");
const inputExchange = 'events__shipment_created'
const inputQueue = 'mszipcode_input'

const outputExchange = 'events__ms_zipcode_output'

require('dotenv').config()
const prisma = new PrismaClient()
const cepPromises = require('cep-promise')

consumer(inputExchange, inputQueue, async (channel, msg) => {
    try {
        const updatedShipment = JSON.parse(msg.content.toString())
        let address = await prisma.address.findUnique({
            where: { cep: updatedShipment.zipDestination },
        })

        const response = await cepPromises(updatedShipment.zipDestination)

        if (!address) {
            address = await prisma.address.create({
                data: {
                    cep: updatedShipment.zipDestination,
                    street: response.street,
                    state: response.state,
                    city: response.city,
                    neighborhood: response.neighborhood
                }
            })
        }


        address = await prisma.address.updateMany({
            where: { 
                cep: {
                    equals: updatedShipment.zipDestination 
                }
            },
            data: {
                street: response.street,
                state: response.state,
                city: response.city,
                neighborhood: response.neighborhood
            }
        })

        producer(outputExchange, response)
        channel.ack(msg)
    } catch (e) {
        console.error('ERROR:', e)
        channel.nack(msg)
    }

})