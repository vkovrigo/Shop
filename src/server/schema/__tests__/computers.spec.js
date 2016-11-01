'use strict';

import env from '../../../../env';
import mongoMiddleware from '../../middleware/mongo';
import serverMiddleware from '../../middleware/server';
import ComputerModel from '../../models/computers';

import express from 'express';
import request from 'superagent';
import mongoose from 'mongoose';

describe('Test requests via GraphQL to computers entity', () => {

    const host = env.get('express:host'),
        port = env.get('express:port'),
        api = env.get('app:api'),
        url = `${host}:${port}${api}`;

    before('start app and db', done => {
        const app = express();

        Promise.all([
            serverMiddleware(app),
            mongoMiddleware(app)
        ])
        .then(() => done())
        .catch(done);
    });

    beforeEach('remove all computers before start test', done => {
        ComputerModel.remove().then(() => done()).catch(done);
    })

    it('should return only one computer', (done) => {
        const query = `query { computers { mark }}`,
            computer = new ComputerModel(pcGenerator(['iPC'])[0]);

        computer.save().then(() => {
            request
                .get(url)
                .query({query})
                .end((err, res) => {
                    if (err) done(err);

                    expect(res.body.data.computers.length).to.be.equal(1);

                    done();
                });
        });
    });

    it('should add new computer', done => {
        const mark = 'SuperBrand',
            query = `mutation{
                        insertComputer(
                            mark:"${mark}", model:"Dab", color:"red",
                            wifi:"802.11ac", isLaptop:true, diagonal:13,
                            coresNumber:42, usb2:2, usb3:3, ram:256, memory:32,
                            videocard:"SuperPuper", videomemory:512,
                            processor:"MegaGerc", operatingSystem:"OS100500",
                            price:100500
                        )
                        { mark }
                    }`;

        request
            .post(url)
            .query({query})
            .end((err, res) => {
                if (err) done(err);

                ComputerModel.find({}, (err, computers) => {
                    if (err) done(err);

                    expect(computers.length).to.be.equal(1);
                    expect(computers[0].mark).to.be.equal(mark);

                    done();
                });
            });
    });

    it('should find computers filtered by `mark`', done => {
        const brand = 'brand',
            pcs = pcGenerator([brand, brand, 'Other Brand']);

        ComputerModel.collection.insert(pcs, (err, result) => {
            const query = `query { computers(mark: "${brand}") { mark }}`;

            request
                .get(url)
                .query({query})
                .end((err, res) => {
                    if (err) done(err);

                    const computers = res.body.data.computers;

                    expect(computers.length).to.be.equal(2);
                    expect(computers[0].mark).to.be.equal(brand);
                    expect(computers[1].mark).to.be.equal(brand);

                    done();
                });
        });
    });

});

/**
 * Help method for generate list of pc object with predefined `mark`.
 *
 * @param  {Array<string>} brands - The list of marks;
 * @return {Array<object>} Return list of computers.
 */
function pcGenerator(brands) {
    return brands.map(brand => ({
            mark: brand,
            model: 'GX',
            color: 'black',
            wifi: '802',
            isLaptop: true,
            diagonal: 11,
            coresNumber: 1,
            usb2: 0,
            usb3: 0,
            ram: 1,
            memory: 128,
            videocard: 'Intel',
            videomemory: 1,
            processor: 'Intel',
            operatingSystem: 'Windows',
            price: 300
        })
    );
};
