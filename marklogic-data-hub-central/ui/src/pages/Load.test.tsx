import React, {useContext} from 'react';
import { render, fireEvent, waitForElement, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import {AuthoritiesContext, AuthoritiesService} from '../util/authorities';
import axiosMock from 'axios';
import mocks from '../config/mocks.config';
import Load from "./Load";

jest.mock('axios');

const DEFAULT_VIEW = 'list';

describe('Load component', () => {

    beforeEach(() => {
        mocks.loadAPI(axiosMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
        cleanup();
    })

    test('Verify cannot edit with only readIngestion authority', async () => {
        const authorityService = new AuthoritiesService();
        authorityService.setAuthorities(['readIngestion']);

        const { getByText, getByTitle, getByLabelText, getByTestId, queryByTestId, queryByText, queryByTitle } = render(<AuthoritiesContext.Provider value={authorityService}><Load/></AuthoritiesContext.Provider>);

        expect(await(waitForElement(() => getByLabelText('switch-view-list')))).toBeInTheDocument();

        // Check for steps to be populated
        expect(axiosMock.get).toBeCalledWith('/api/steps/ingestion');
        expect(getByText('testLoad')).toBeInTheDocument();

        // Check list view
        await fireEvent.click(getByLabelText('switch-view-list'));
        // test 'Add New' button
        expect(queryByText('Add New')).not.toBeInTheDocument();

        await fireEvent.click(getByTestId('testLoad-settings'));
        expect(await(waitForElement(() => getByText('Target Database:')))).toBeInTheDocument();

        expect(getByText('Save')).toBeDisabled();
        await fireEvent.click(getByText('Cancel'));
        // test delete
        expect(queryByTestId('testLoad-delete')).not.toBeInTheDocument();

        // Check card layout
        await fireEvent.click(getByLabelText('switch-view-card'));

        // test 'Add New' button
        expect(queryByText('Add New')).not.toBeInTheDocument();

        // test settings
        await fireEvent.click(getByLabelText('icon: setting'));
        expect(await(waitForElement(() => getByText('Target Database:')))).toBeInTheDocument();
        expect(getByText('Save')).toBeDisabled();
        await fireEvent.click(getByText('Cancel'));

        // test delete
        expect(queryByTitle('delete')).not.toBeInTheDocument();
    });

    test('Verify edit with readIngestion and writeIngestion authorities', async () => {
        const authorityService = new AuthoritiesService();
        authorityService.setAuthorities(['readIngestion','writeIngestion']);

        const { getByText, getByTitle, getByLabelText, getByTestId } = render(<AuthoritiesContext.Provider value={authorityService}><Load/></AuthoritiesContext.Provider>);

        expect(await(waitForElement(() => getByLabelText('switch-view-list')))).toBeInTheDocument();

        // Check for steps to be populated
        expect(axiosMock.get).toBeCalledWith('/api/steps/ingestion');
        expect(getByText('testLoad')).toBeInTheDocument();

        // Check list view
        await fireEvent.click(getByLabelText('switch-view-list'));
        // test 'Add New' button
        expect(getByText('Add New')).toBeInTheDocument();
        // test settings
        await fireEvent.click(getByTestId('testLoad-settings'));
        expect(await(waitForElement(() => getByText('Target Database:')))).toBeInTheDocument();

        expect(getByText('Save')).not.toBeDisabled();
        await fireEvent.click(getByText('Cancel'));
        // test delete
        await fireEvent.click(getByTestId('testLoad-delete'));
        await fireEvent.click(getByText('No'));

        // Check card layout
        await fireEvent.click(getByLabelText('switch-view-card'));
        // test 'Add New' button
        expect(getByText('Add New')).toBeInTheDocument();

        await fireEvent.click(getByTestId('testLoad-settings'));
        expect(await(waitForElement(() => getByText('Target Database:')))).toBeInTheDocument();
        expect(getByText('Save')).not.toBeDisabled();
        await fireEvent.click(getByText('Cancel'));
        // test delete
        await fireEvent.click(getByTestId('testLoad-delete'));
        await fireEvent.click(getByText('Yes'));
        expect(axiosMock.delete).toHaveBeenNthCalledWith(1,'/api/steps/ingestion/testLoad');
    });

    test('Verify list and card views', async () => {
        const authorityService = new AuthoritiesService();
        authorityService.setAuthorities(['readIngestion','writeIngestion']);

        const { getByText, getAllByText, getByLabelText } = render(<AuthoritiesContext.Provider value={authorityService}><Load/></AuthoritiesContext.Provider>);

        expect(await(waitForElement(() => getByLabelText('switch-view-list')))).toBeInTheDocument();

        // Check for steps to be populated in default view
        expect(axiosMock.get).toBeCalledWith('/api/steps/ingestion');
        expect(getByText('testLoad')).toBeInTheDocument();
        expect(getByLabelText('load-' + DEFAULT_VIEW)).toBeInTheDocument();

        // Check list view
        await fireEvent.click(getByLabelText('switch-view-list'));
        expect(getByText('testLoad')).toBeInTheDocument();
        expect(getByText('Test JSON.')).toBeInTheDocument();
        expect(getAllByText('json').length > 0);
        expect(getByText('01/01/2000 4:00AM')).toBeInTheDocument();
        expect(getByLabelText('icon: setting')).toBeInTheDocument();
        expect(getByLabelText('icon: delete')).toBeInTheDocument();

        // Check card view
        await fireEvent.click(getByLabelText('switch-view-card'));
        expect(getByText('testLoad')).toBeInTheDocument();
        expect(getByText('JSON')).toBeInTheDocument();
        expect(getByText('Last Updated: 01/01/2000 4:00AM')).toBeInTheDocument();
        expect(getByLabelText('icon: setting')).toBeInTheDocument();
        expect(getByLabelText('icon: edit')).toBeInTheDocument();
        expect(getByLabelText('icon: delete')).toBeInTheDocument();

    });

});
