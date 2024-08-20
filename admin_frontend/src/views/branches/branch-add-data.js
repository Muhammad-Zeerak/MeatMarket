import React, { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import useGoogle from 'react-google-autocomplete/lib/usePlacesAutocompleteService';
import userService from '../../services/user';
import { shallowEqual, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Map from '../../components/map';
import MediaUpload from '../../components/upload';
import { AppstoreOutlined } from '@ant-design/icons';
import UserModal from '../../components/shop/user-modal';
import { RefetchSearch } from '../../components/refetch-search';
import { MAP_API_KEY } from 'configs/app-global';
import getAddress from 'helpers/getAddress';

let renderCount = 0;

const RestaurantAddData = ({
  logoImage,
  setLogoImage,
  backImage,
  setBackImage,
  form,
  location,
  setLocation,
  user,
}) => {
  console.log('render count', ++renderCount);
  const { t } = useTranslation();
  const [userModal, setUserModal] = useState(null);
  const [userRefetch, setUserRefetch] = useState(null);
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual
  );

  const [value, setValue] = useState('');
  const { placePredictions, getPlacePredictions, isPlacePredictionsLoading } =
    useGoogle({
      apiKey: MAP_API_KEY,
      libraries: ['places'],
    });

  async function fetchUserList(search) {
    const params = { search, roles: 'user', 'empty-shop': 1 };
    setUserRefetch(false);
    return userService.search(params).then((res) =>
      res.data.map((item) => ({
        label: item.firstname + ' ' + (item.lastname ? item.lastname : ''),
        value: item.id,
      }))
    );
  }

  const goToAddClient = () => {
    setUserModal(true);
    setUserRefetch(true);
  };

  const handleCancel = () => setUserModal(false);

  return (
    <Row gutter={12}>
      <Col span={24}>
        <Card>
          <Row gutter={12}>
            <Col span={4}>
              <Form.Item
                label={t('logo.image')}
                name='logo_img'
                rules={[
                  {
                    validator(_, value) {
                      if (logoImage.length === 0) {
                        return Promise.reject(t('required'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <MediaUpload
                  type='shops/logo'
                  imageList={logoImage}
                  setImageList={setLogoImage}
                  form={form}
                  multiple={false}
                  name='logo_img'
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label={t('background.image')}
                name='background_img'
                rules={[
                  {
                    validator(_, value) {
                      if (backImage.length === 0) {
                        return Promise.reject(t('required'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <MediaUpload
                  type='shops/background'
                  imageList={backImage}
                  setImageList={setBackImage}
                  form={form}
                  multiple={false}
                  name='background_img'
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label={t('status.note')} name='status_note'>
                <TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name='status' label={t('status')}>
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={2}>
              <Form.Item label={t('open')} name='open' valuePropName='checked'>
                <Switch disabled />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={24}>
        <Card title={t('general')}>
          <Row gutter={12}>
            <Col span={12}>
              <Row gutter={12}>
                <Col span={24}>
                  {languages.map((item, idx) => (
                    <Form.Item
                      key={'title' + idx}
                      label={t('title')}
                      name={`title[${item.locale}]`}
                      rules={[
                        {
                          validator(_, value) {
                            if (!value && item.locale === defaultLang) {
                              return Promise.reject(new Error(t('required')));
                            } else if (value && value?.trim() === '') {
                              return Promise.reject(
                                new Error(t('no.empty.space'))
                              );
                            } else if (value?.length < 2) {
                              return Promise.reject(
                                new Error(t('must.be.at.least.2'))
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                      hidden={item.locale !== defaultLang}
                    >
                      <Input />
                    </Form.Item>
                  ))}
                </Col>
                <Col span={24}>
                  <Form.Item
                    label={t('phone')}
                    name='phone'
                    rules={[
                      { required: true, message: t('required') },
                      {
                        validator(_, value) {
                          if (value && value < 0) {
                            return Promise.reject(
                              new Error(t('must.be.positive'))
                            );
                          } else if (value && value?.toString().length < 7) {
                            return Promise.reject(
                              new Error(t('must.be.at.least.7.numbers'))
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber className='w-100' />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            <Col span={12}>
              {languages.map((item, idx) => (
                <Form.Item
                  key={'desc' + idx}
                  label={t('description')}
                  name={`description[${item.locale}]`}
                  rules={[
                    {
                      validator(_, value) {
                        if (!value && item.locale === defaultLang) {
                          return Promise.reject(new Error(t('required')));
                        } else if (value && value?.trim() === '') {
                          return Promise.reject(new Error(t('no.empty.space')));
                        } else if (value?.length < 5) {
                          return Promise.reject(
                            new Error(t('must.be.at.least.5'))
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                  hidden={item.locale !== defaultLang}
                >
                  <TextArea rows={4} />
                </Form.Item>
              ))}
            </Col>

            <Col span={8}>
              <Form.Item
                label={t('seller')}
                name='user'
                rules={[{ required: true, message: t('required') }]}
              >
                <RefetchSearch
                  disabled={user}
                  fetchOptions={fetchUserList}
                  refetch={userRefetch}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <Button
                        className='w-100'
                        disabled={user}
                        icon={<AppstoreOutlined />}
                        onClick={goToAddClient}
                      >
                        {t('add.user')}
                      </Button>
                    </>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={8}>
        <Card title={t('delivery')}>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name='price'
                label={t('min.price')}
                rules={[
                  { required: true, message: t('required') },
                  {
                    type: 'number',
                    min: 0,
                    message: t('must.be.at.least.0'),
                  },
                ]}
              >
                <InputNumber className='w-100' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='price_per_km'
                label={t('price.per.km')}
                rules={[
                  { required: true, message: t('required') },
                  {
                    type: 'number',
                    min: 0,
                    message: t('must.be.at.least.0'),
                  },
                ]}
              >
                <InputNumber className='w-100' />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name='max_cap_free_delivery'
                label={t('max_cap_free_delivery')}
                rules={[
                  { required: true, message: t('required') },
                  {
                    type: 'number',
                    min: 0,
                    message: t('must.be.at.least.0'),
                  },
                ]}
              >
                <InputNumber className='w-100' />
              </Form.Item>
            </Col>

          </Row>
        </Card>
      </Col>
      <Col span={8}>
        <Card title={t('delivery.time')}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name='delivery_time_type'
                label={t('delivery_time_type')}
                rules={[{ required: true, message: t('required') }]}
              >
                <Select className='w-100'>
                  <Select.Option value='minute' label={t('minutes')} />
                  <Select.Option value='hour' label={t('hour')} />
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='delivery_time_from'
                label={t('delivery_time_from')}
                rules={[
                  { required: true, message: t('required') },
                  {
                    validator(_, value) {
                      if (value < 0) {
                        return Promise.reject(
                          new Error(t('must.be.at.least.0'))
                        );
                      }

                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber className='w-100' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='delivery_time_to'
                label={t('delivery_time_to')}
                rules={[
                  { required: true, message: t('required') },
                  {
                    validator(_, value) {
                      if (value < 0) {
                        return Promise.reject(
                          new Error(t('must.be.at.least.0'))
                        );
                      }

                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber className='w-100' />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={8}>
        <Card title={t('order.info')}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label={t('min.amount')}
                name='min_amount'
                rules={[
                  { required: true, message: t('required') },
                  {
                    type: 'number',
                    min: 0,
                    message: t('must.be.at.least.0'),
                  },
                ]}
              >
                <InputNumber className='w-100' />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={t('tax')}
                name='tax'
                rules={[
                  { required: true, message: t('required') },
                  {
                    type: 'number',
                    min: 0,
                    message: t('must.be.at.least.0'),
                  },
                ]}
              >
                <InputNumber addonAfter={'%'} className='w-100' />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={t('admin.comission')}
                name='percentage'
                rules={[
                  { required: true, message: t('required') },
                  {
                    type: 'number',
                    min: 0,
                    message: t('must.be.at.least.0'),
                  },
                ]}
              >
                <InputNumber className='w-100' addonAfter={'%'} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={t('fixed.amount')}
                name='fixed_amount'
                rules={[
                  { required: true, message: t('required') },
                  {
                    type: 'number',
                    min: 0,
                    message: t('must.be.at.least.0'),
                  },
                ]}
              >
                <InputNumber className='w-100' />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={24}>
        <Card title={t('address')}>
          <Row gutter={12}>
            <Col span={12}>
              {languages.map((item, idx) => (
                <Form.Item
                  key={'address' + idx}
                  label={t('address')}
                  name={`address[${item.locale}]`}
                  rules={[
                    {
                      required: item.locale === defaultLang,
                      message: t('required'),
                    },
                  ]}
                  hidden={item.locale !== defaultLang}
                >
                  <Select
                    allowClear
                    searchValue={value}
                    showSearch
                    autoClearSearchValue
                    loading={isPlacePredictionsLoading}
                    options={placePredictions?.map((prediction) => ({
                      label: prediction.description,
                      value: prediction.description,
                    }))}
                    onSearch={(searchValue) => {
                      setValue(searchValue);
                      if (searchValue.length > 0) {
                        getPlacePredictions({ input: searchValue });
                      }
                    }}
                    onSelect={async (value) => {
                      const address = await getAddress(value);
                      setLocation({
                        lat: address?.geometry.location.lat,
                        lng: address?.geometry.location.lng,
                      });
                    }}
                  />
                </Form.Item>
              ))}
            </Col>
            <Col span={24}>
              <Map
                location={location}
                setLocation={setLocation}
                setAddress={(value) =>
                  form.setFieldsValue({ [`address[${defaultLang}]`]: value })
                }
              />
            </Col>
          </Row>
        </Card>
      </Col>
      {userModal && (
        <UserModal visible={userModal} handleCancel={() => handleCancel()} />
      )}
    </Row>
  );
};

export default RestaurantAddData;
