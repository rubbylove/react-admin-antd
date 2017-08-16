import React from 'react'
import {Modal, Form, Row, Col, Input, Button, DatePicker, Select, Table} from 'antd'
import { apiPost } from '../../../../api/index'
import moment from 'moment'
const FormItem = Form.Item
const {RangePicker} = DatePicker
const Option = Select.Option
class sumElectricityAddUp extends React.Component {
    state = {
        visible: false,
        isFirst: true,
        ClientList: [],
        sumElectricityRecordlList: [],
        subletList: [],
        roomNumberOne: [],
        meterReader: [],
        Contract: {},
        sumElectricity: 0,
        thisReceivable: 0,
        powerType: 0,
        bili: [],
        balanceUUID: 0
    }
    componentWillReceiveProps (nextProps) {
        this.initialRemarks(nextProps)
    }
    componentDidMount () {
        this.getClientListAndUser()
        this.setTableColunms()
    }
    handleSubmit = async (e) => {
        let adopt = false
        this.props.form.validateFields(
            (err) => {
                adopt = !err
            }
        )
        if (adopt) {
            let json = this.props.form.getFieldsValue()
            for (let item in this.state.Contract) {
                json[item] = this.state.Contract[item]
            }
            delete json['id']
            json['preWattDate'] = json.sfzq[0].format('YYYY-MM-DD')
            json['wattDate'] = json.sfzq[1].format('YYYY-MM-DD')
            json['overdueDate'] = json.overdueDate.format('YYYY-MM-DD')
            json['sumElectricity'] = this.state.sumElectricity
            json['thisReceivable'] = this.state.thisReceivable
            json['conteractId'] = this.state.Contract.id
            let elecList = this.state.sumElectricityRecordlList
            elecList.pop()
            elecList.map((record, i) => {
                record['lastSurfaceDate'] = json.sfzq[0].format('YYYY-MM-DD')
                record['surfaceDate'] = json.sfzq[1].format('YYYY-MM-DD')
                record['readingId'] = json.readId
                record['buildingIdOne'] = this.state.Contract.buildId
                if (record.uuid.toString() === this.state.balanceUUID.toString()) {
                    json['differentialPrice'] = record.unitPrice
                    json['difference'] = record.singleMoney
                    elecList.splice(i, 1)
                }
            })
            console.log(elecList)
            let list = JSON.stringify(elecList)
            json['list'] = list
            if (this.props.id > 0) {
                json['oldId'] = this.props.id
                await apiPost(
                    '/ElectricityFees/addElectricityFee',
                    json
                )
            } else {
                await apiPost(
                    '/ElectricityFees/addElectricityFee',
                    json
                )
            }
            this.setState({visible: false,
                isFirst: true })
            this.props.refreshTable()
        }
    }
    handleCancel = (e) => {
        this.setState({ visible: false,
            isFirst: true})
        this.props.refreshTable()
    }
    setTableColunms = (contract, powerType) => {
        let deleteRecord = this.deleteRecord
        let tableColumns = [{
            title: '电费名称',
            dataIndex: 'electricCostName'
        }, {
            title: '房间编号',
            dataIndex: 'roomNumberOne'
        }, {
            title: '上次抄表数',
            dataIndex: 'lastSurfaceNumber'
        }, {
            title: '本次抄表数',
            dataIndex: 'surfaceNumber'
        }, {
            title: '本次用电量',
            dataIndex: 'needElectricity'
        }, {
            title: '变比',
            dataIndex: 'ratio'
        }, {
            title: '总电量',
            dataIndex: 'sumElectricity'
        }, {
            title: '单价(1.0685)',
            dataIndex: 'unitPrice'
        }, {
            title: '金额',
            dataIndex: 'singleMoney',
            render: function (text) {
                return (
                    parseFloat(text).toFixed(2)
                )
            }
        }, {
            title: '备注',
            dataIndex: 'remarks'
        }, {
            title: '操作',
            render: function (text, record, index) {
                return (
                    record.uuid ?
                        <a onClick={() => deleteRecord(record.uuid)}>删除</a> :
                        null
                )
            }
        }]
        if (contract) {
            if (contract[powerType].toString() === '0') {
                tableColumns.splice(6, 0, {
                    title: '电损0%',
                    dataIndex: 'electricLoss'
                })
            } else if (contract[powerType].toString() === '1') {
                tableColumns.splice(6, 0, {
                    title: '电损' + contract.powerLossRatio + '%',
                    dataIndex: 'electricLoss'
                })
            } else {
                tableColumns.splice(6, 0, {
                    title: '电损' + contract.powerLossRatio + '%',
                    dataIndex: 'electricLoss'
                })
                tableColumns.splice(8, 0, {
                    title: '峰谷比例',
                    dataIndex: 'valleysProportion'
                })
                // 查询峰谷比利
                this.searchBili(contract.clientId)
            }
        }

        this.setState({tableColumns: tableColumns})
    }
    searchBili = async (clientId) => {
        let bili = await apiPost(
            '/ElectricityFees/AverageElectricityFee',
            {id: clientId}
        )
        this.setState({
            bili: bili.data
        })
    }
    async initialRemarks (nextProps) {
        if (this.state.isFirst && nextProps.visible) {
            this.props.form.resetFields()
            if (nextProps.id > 0) {
                let map = await apiPost(
                    '/ElectricityFees/ElectricityFeeInfo',
                    {id: nextProps.id}
                )
                let electricityFees = map.data.electricityFees
                let subletList = await apiPost(
                    '/propertyFee/getSubletByPmId',
                    {id: electricityFees.contractId}
                )
                subletList = subletList.data
                // 设置表格标题
                this.setTableColunms(map.data.electricityFees, 'wattHourType')
                let list = map.data.list
                list.map(record => {
                    record.uuid = new Date().getTime()
                })
                let balanceUUID = new Date().getTime()
                list.push({
                    unitPrice: map.data.electricityFees.differentialPrice,
                    singleMoney: map.data.electricityFees.difference,
                    electricCostName: '上月差额',
                    uuid: balanceUUID})
                this.addTotalColunm()
                this.state.ClientList.map(contract => {
                    if (contract.id === electricityFees.conteractId) {
                        this.setState({Contract: contract})
                    }
                })
                this.setState({
                    visible: nextProps.visible,
                    isFirst: false,
                    sumElectricityRecordlList: list,
                    ratio: electricityFees.ratio,
                    sumElectricity: electricityFees.sumElectricity,
                    thisReceivable: electricityFees.thisReceivable,
                    subletList: subletList,
                    roomNumberOne: electricityFees.roomNumber.split(','),
                    balanceUUID: balanceUUID
                })
                this.props.form.setFieldsValue({
                    clientName: electricityFees.clientName,
                    subletIdOne: electricityFees.subletName,
                    sfzq: [moment(electricityFees.preWattDate), moment(electricityFees.wattDate)],
                    overdueDate: moment(electricityFees.overdueDate),
                    formName: electricityFees.formName,
                    receivablesingleMoney: electricityFees.receivablesingleMoney,
                    principalDiscount: electricityFees.principalDiscount,
                    subletName: electricityFees.subletName,
                    roomId: electricityFees.roomId,
                    roomNumber: electricityFees.roomNumber,
                    readIdOne: electricityFees.readName,
                    readId: electricityFees.readId
                })
            } else {
                this.setState({
                    visible: nextProps.visible,
                    isFirst: false,
                    sumElectricityRecordlList: [],
                    ratio: 0,
                    sumElectricity: 0,
                    thisReceivable: 0,
                    Contract: {},
                    subletList: [],
                    roomNumberOne: []
                })
            }
        }
    }
    async getClientListAndUser () {
        let ClientList = await apiPost(
            '/propertyFee/getPmContractList',
            {contractStatus: 0}
        )
        let meterReader = await apiPost(
            '/water/getchaobiaouser',
            {code: 'chaobiaoren'}
        )

        this.setState({
            ClientList: ClientList.data,
            meterReader: meterReader.data
        })
    }
    complement (arr1, arr2) {
        const arr = arr1.toString().split(',')
        let j = 0
        arr1.forEach((a, i) => {
            arr2.forEach((b) => {
                if (a === b) {
                    arr.splice(i - j, 1)
                    j = j + 1
                }
            })
        })
        return arr
    }
    // 选择客户名称 参数：客户id
    chooseClient = (clientId) => {
        this.props.form.resetFields()
        this.setState({
            sumElectricityRecordlList: []
        })
        this.state.ClientList.map(async (contract) => {
            let formName = ''
            if (clientId.toString() === contract.id.toString()) {
                console.log(contract)
                formName = contract.clientName
                let lastTimeData = await apiPost(
                    '/ElectricityFees/LastTimeDate',
                    {contractId: clientId,
                        clientId: contract.clientId,
                        clientType: 1}
                )
                let subletList = await apiPost(
                    '/propertyFee/getSubletByPmId',
                    {id: clientId}
                )
                this.setTableColunms(contract, 'powerType')
                let roomNumber = contract.leaseRooms.split(',')
                let roomIds = contract.roomIds.split(',')
                subletList = subletList.data
                if (!subletList) {
                    subletList = []
                }
                if (subletList.length > 0) {
                    subletList.map(sublet => {
                        roomNumber = this.complement(roomNumber, sublet.leaseRooms.split(','))
                        roomIds = this.complement(roomIds, sublet.roomNum.split(','))
                        return ''
                    })
                }
                this.setState({
                    Contract: contract,
                    subletList: subletList,
                    roomNumberOne: roomNumber,
                    powerType: contract.powerType
                })
                let sfzq = lastTimeData.data ? [moment(lastTimeData.data.wattDate)] : null
                this.props.form.setFieldsValue({
                    unitPrice: contract.powerUnitPrice,
                    currentMouthUnitPrice: contract.powerUnitPrice,
                    sfzq: sfzq,
                    roomNumber: roomNumber.toString(),
                    formName: formName,
                    ratio: contract.powerRatio,
                    lastMouthUnitPrice: lastTimeData.data.electricityFees.powerUnitPrice ? lastTimeData.data.electricityFees.powerUnitPrice : 0,
                    lastMouthTotalDosage: lastTimeData.data.electricityFees.sumElectricity ? lastTimeData.data.electricityFees.sumElectricity : 0
                })
            }
        })
    }
    readIdOne = (value) => {
        this.props.form.setFieldsValue({
            readId: value
        })
    }
    // 点击选择转租客户的事件
    chooseSublet = (value) => {
        this.state.subletList.forEach(async sublet => {
            let formName = ''
            if (value.toString() === sublet.clientId.toString()) {
                formName = sublet.clientName
                let lastTimeData = await apiPost(
                    '/ElectricityFees/LastTimeDate',
                    {clientId: sublet.clientId,
                        clientType: 2,
                        contractId: sublet.contractId}
                )
                this.setState({
                    roomNumberOne: sublet.leaseRooms.split(',')
                })
                let sfzq = lastTimeData.data ? [moment(lastTimeData.data.wattDate)] : null
                this.props.form.setFieldsValue({
                    roomNumber: sublet.leaseRooms.toString(),
                    formName: formName,
                    sfzq: sfzq,
                    lastMouthUnitPrice: lastTimeData.data.electricityFees.powerUnitPrice ? lastTimeData.data.electricityFees.powerUnitPrice : 0,
                    lastMouthTotalDosage: lastTimeData.data.electricityFees.sumElectricity ? lastTimeData.data.electricityFees.sumElectricity : 0
                })
            }
        })
    }
    // 添加违约金
    addLiquidatedDamages = () => {
        this.deleteTotalColunm()
        let json = this.props.form.getFieldsValue()
        let jsonTwo = {}
        jsonTwo['singleMoney'] = json.liquidatedDamagessingleMoney
        jsonTwo['electricCostName'] = json.liquidatedDamagesName
        jsonTwo['uuid'] = new Date().getTime()
        jsonTwo['surfaceType'] = 3
        let sumElectricityRecordlList = this.state.sumElectricityRecordlList
        sumElectricityRecordlList.push(jsonTwo)
        this.setState({
            sumElectricityRecordlList: sumElectricityRecordlList
        })
        this.addTotalColunm()
    }
    // 添加上月差额
    addBalance = () => {
        console.log(this.state.balanceUUID)
        this.deleteTotalColunm()
        if (this.state.balanceUUID) {
            let recordList = this.state.sumElectricityRecordlList
            recordList.map((record, i) => {
                if (record.uuid.toString() === this.state.balanceUUID.toString()) {
                    recordList.splice(i, 1)
                    this.setState({
                        sumElectricityRecordlList: recordList
                    })
                }
            })
        }
        let json = this.props.form.getFieldsValue()
        let jsonTwo = {}
        jsonTwo['uuid'] = new Date().getTime()
        jsonTwo['unitPrice'] = json.unitPriceBalance
        jsonTwo['singleMoney'] = json.balance
        jsonTwo['electricCostName'] = '上月差额'
        let sumElectricityRecordlList = this.state.sumElectricityRecordlList
        sumElectricityRecordlList.push(jsonTwo)
        this.setState({
            sumElectricityRecordlList: sumElectricityRecordlList,
            balanceUUID: jsonTwo.uuid
        })
        this.addTotalColunm()
        console.log(this.state.balanceUUID)
    }
    // 添加条目
    add = () => {
        this.deleteTotalColunm()
        let json = this.props.form.getFieldsValue()
        let jsonTwo = {}
        jsonTwo['uuid'] = new Date().getTime()
        jsonTwo['roomNumberOne'] = json.roomNumberOne
        jsonTwo['lastSurfaceNumber'] = json.lastSurfaceNumber ? json.lastSurfaceNumber : 0
        jsonTwo['surfaceNumber'] = json.surfaceNumber ? json.surfaceNumber : 0
        jsonTwo['ratio'] = json.ratio ? json.ratio : 0
        if (this.state.powerType === 2) {
            this.state.bili.map(type => {
                if (type.name === json.moneyType) {
                    jsonTwo['electricCostName'] = json.moneyType
                    jsonTwo['valleysProportion'] = type.value
                }
            })
        } else {
            jsonTwo['electricCostName'] = json.electricCostName
        }
        jsonTwo['surfaceType'] = this.state.Contract.wattHourType
        jsonTwo['unitPrice'] = json.unitPrice ? json.unitPrice : 0
        jsonTwo['needElectricity'] = (json.surfaceNumber - json.lastSurfaceNumber) ? json.surfaceNumber - json.lastSurfaceNumber : 0
        jsonTwo['remarks'] = json.remarks
        // 电损比例
        let powerLossRatio = this.state.Contract.powerLossRatio ? this.state.Contract.powerLossRatio / 100 : 0

        if (this.state.powerType === 0) {
            jsonTwo['electricLoss'] = this.state.Contract.powerLossRatio ? jsonTwo.needElectricity * jsonTwo.ratio * powerLossRatio : 0
            jsonTwo['sumElectricity'] = (jsonTwo.needElectricity * json.ratio) ? (json.needElectricity * json.ratio) : 0
        } else {
            jsonTwo['electricLoss'] = this.state.Contract.powerLossRatio ? jsonTwo.needElectricity * jsonTwo.ratio * powerLossRatio : 0
            jsonTwo['sumElectricity'] = jsonTwo.needElectricity * jsonTwo.ratio + jsonTwo['electricLoss']
        }
        jsonTwo['singleMoney'] = (jsonTwo.sumElectricity * jsonTwo.unitPrice) ? (jsonTwo.sumElectricity * jsonTwo.unitPrice) : 0
        let sumElectricityRecordlList = this.state.sumElectricityRecordlList
        sumElectricityRecordlList.push(jsonTwo)
        this.setState({
            sumElectricityRecordlList: sumElectricityRecordlList
        })
        this.addTotalColunm()
    }
    // 删除条目
    deleteRecord = (uuid) => {
        this.deleteTotalColunm()
        let recordList = this.state.sumElectricityRecordlList
        recordList.map((record, i) => {
            if (record.uuid.toString() === uuid.toString()) {
                recordList.splice(i, 1)
                this.setState({
                    sumElectricityRecordlList: recordList
                })
            }
            return ''
        })
        this.addTotalColunm()
    }
    // 删除合计行
    deleteTotalColunm = () => {
        let sumElectricityRecordlList = this.state.sumElectricityRecordlList
        sumElectricityRecordlList.pop()
    }
    // 添加合计行
    addTotalColunm = () => {
        let sumElectricityRecordlList = this.state.sumElectricityRecordlList
        let sumElec = 0
        let sumSingeMoney = 0
        sumElectricityRecordlList.map((record) => {
            if (record.sumElectricity) {
                sumElec += record.sumElectricity
                sumSingeMoney += (record.sumElectricity * record.unitPrice)
            } else {
                sumSingeMoney += Number(record.singleMoney)
            }
        })
        let json = {}
        json['electricCostName'] = '合计'
        json['sumElectricity'] = sumElec
        json['singleMoney'] = sumSingeMoney.toFixed(2)
        sumElectricityRecordlList.push(json)
        this.props.form.setFieldsValue({
            receivablesingleMoney: sumSingeMoney.toFixed(2)

        })
        this.setState({
            sumElectricity: sumElec,
            thisReceivable: sumSingeMoney.toFixed(2)
        })
    }

    // 优惠金额
    amountReceivable = (e) => {
        let num = e.target.value
        this.props.form.setFieldsValue({
            receivablesingleMoney: (parseFloat(this.state.thisReceivable) - parseFloat(num ? num : 0)).toFixed(2)
        })
    }
    // 本次抄表数
    currentMeterReading = () => {
        let json = this.props.form.getFieldsValue()
        json['surfaceNumber'] = json.surfaceNumber ? json.surfaceNumber : 0
        json['lastSurfaceNumber'] = json.lastSurfaceNumber ? json.lastSurfaceNumber : 0
        this.props.form.setFieldsValue({
            needElectricity: (json.surfaceNumber - json.lastSurfaceNumber).toFixed(2)
        })
    }
    // 差额
    balancesingleMoney = () => {
        let json = this.props.form.getFieldsValue()
        json['lastMouthUnitPrice'] = json.lastMouthUnitPrice ? json.lastMouthUnitPrice : 0
        json['currentMouthUnitPrice'] = json.currentMouthUnitPrice ? json.currentMouthUnitPrice : 0
        json['lastMouthTotalDosage'] = json.lastMouthTotalDosage ? json.lastMouthTotalDosage : 0
        this.props.form.setFieldsValue({
            unitPriceBalance: (json.currentMouthUnitPrice - json.lastMouthUnitPrice).toFixed(5),
            balance: ((json.currentMouthUnitPrice - json.lastMouthUnitPrice) * json.lastMouthTotalDosage).toFixed(2)
        })
    }
    // 选择房间编号
    chooseRoomNumber = async (value) => {
        // 查询上次抄表数
        let lastTimeData = await apiPost(
            '/ElectricityFees/LastTimeNumber',
            {
                roomNumberOne: value,
                buildingIdOne: this.state.Contract.buildId
            }
        )
        lastTimeData = lastTimeData.data
        if (lastTimeData !== null && lastTimeData !== '' && typeof (lastTimeData) !== 'undefined') {
            this.props.form.setFieldsValue({
                lastSurfaceNumber: lastTimeData.surfaceNumber
            })
        }
    }
    // 点击选择功峰平谷的点击事件
    chooseMoneyType = (value) => {
        this.state.bili.map((type) => {
            if (value === type.name) {
                let json = this.props.form.getFieldsValue()
                this.props.form.setFieldsValue({
                    unitPrice: (parseFloat(type.value) * parseFloat(json.unitPrice)).toFixed(5)
                })
            }
        })
    }
    render () {
        const { getFieldDecorator } = this.props.form
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 6 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 14 }
            }
        }
        const tailFormItemLayout = {
            wrapperCol: {
                xs: {
                    span: 24,
                    offset: 0
                },
                sm: {
                    span: 14,
                    offset: 6
                }
            }
        }
        const titleLayout = {
            color: '#ffffff',
            height: 48,
            backgroundColor: '#0099EB',
            textAlign: 'center',
            fontSize: 16,
            lineHeight: '48px'
        }
        const greenButtonStyle = {
            backgroundColor: '#1FCA3E',
            borderColor: '#1FCA3E'
        }
        return (
            <Modal maskClosable={false}
                title={this.props.title}
                style={{top: 20}}
                width="1100px"
                visible={this.state.visible}
                onOk={this.handleSubmit}
                onCancel={this.handleCancel}
            >
                <Form layout="horizontal">
                    <div style={{background: '#f7f7f7',
                        width: 1050,
                        marginBottom: 20,
                        paddingTop: '22px'}}
                    >
                        <Row>
                            <Col span={8}>
                                <FormItem label="客户名称" labelCol={{ span: 6 }}
                                    wrapperCol={{ span: 15 }}
                                >
                                    {getFieldDecorator('clientName', {
                                        rules: [ {
                                            required: true,
                                            message: '请选择客户名称!'
                                        }]
                                    })(
                                        <Select
                                            showSearch
                                            style={{ width: 200,
                                                marginRight: '10px' }}
                                            placeholder="请选择客户名称"
                                            optionFilterProp="children"
                                            onChange={this.chooseClient}
                                        >
                                            {this.state.ClientList.map(Contract => {
                                                return <Option key={Contract.id}>{Contract.clientName + '(' + Contract.leaseRooms + ')'}</Option>
                                            })}
                                        </Select>)}
                                </FormItem>
                            </Col>
                            <Col span={8}>
                                <FormItem label="转租客户" labelCol={{ span: 6 }}
                                    wrapperCol={{ span: 15 }}
                                >
                                    {getFieldDecorator('subletIdOne')(
                                        <Select
                                            showSearch
                                            style={{ width: 200,
                                                marginRight: '10px' }}
                                            placeholder="请选择转租客户"
                                            optionFilterProp="children"
                                            onChange={this.chooseSublet}
                                        >
                                            {this.state.subletList.map(sub => {
                                                return <Option key={sub.clientId}>{sub.clientName}</Option>
                                            })}
                                        </Select>)}
                                </FormItem>
                            </Col>
                            <Col span={8}>
                                <FormItem label="房间编号" labelCol={{ span: 6 }}
                                    wrapperCol={{ span: 15 }}
                                >
                                    {getFieldDecorator('roomNumber')(<Input />)}
                                </FormItem>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={8}>
                                <FormItem label="本次周期" labelCol={{ span: 6 }}
                                    wrapperCol={{ span: 15 }}
                                >
                                    {getFieldDecorator('sfzq', {
                                        rules: [ {
                                            required: true,
                                            message: '请选择本次周期!'
                                        }]
                                    })(<RangePicker />)}
                                </FormItem>
                            </Col>
                            <Col span={8}>
                                <FormItem label="交费期限" labelCol={{ span: 6 }}
                                    wrapperCol={{ span: 15 }}
                                >
                                    {getFieldDecorator('overdueDate', {
                                        rules: [ {
                                            required: true,
                                            message: '请填写交费期限!'
                                        }]
                                    })(<DatePicker />)}
                                </FormItem>
                            </Col>
                            <Col span={8}>
                                <FormItem label="抄表人员" labelCol={{ span: 6 }}
                                    wrapperCol={{ span: 15 }}
                                >
                                    {getFieldDecorator('readIdOne', {
                                        rules: [ {
                                            required: true,
                                            message: '请选择抄表人员!'
                                        }]
                                    })(
                                        <Select
                                            showSearch
                                            style={{ width: 200,
                                                marginRight: '10px' }}
                                            placeholder="请选择抄表人员"
                                            optionFilterProp="children"
                                            onChange={this.readIdOne}
                                        >
                                            {this.state.meterReader.map(user => {
                                                return <Option key={user.id}>{user.loginName}</Option>
                                            })}
                                        </Select>)}
                                </FormItem>
                            </Col>
                        </Row>
                    </div>
                    <span style={{textAlign: 'center',
                        display: 'block'}}
                    >
                        {getFieldDecorator('formName')(<Input style={{width: '300px'}} />)}
                        <span style={{marginLeft: '20px'}}>电量统计表</span>
                    </span>
                    <br />
                    <div style={{marginBottom: 20}}>
                        <Table
                            columns={this.state.tableColumns}
                            dataSource={this.state.sumElectricityRecordlList}
                            bordered
                            pagination={false}
                        />
                    </div>
                    <Row>
                        <Col span={12} />
                        <Col span={6}>
                            <FormItem label="本期应收" labelCol={{ span: 9 }}
                                wrapperCol={{ span: 12 }}
                            >
                                {getFieldDecorator('receivablesingleMoney', {
                                    rules: [ {
                                        required: true,
                                        message: '请填写本期应收!'
                                    }]
                                })(<Input style={{width: '100px'}} addonBefore="￥" />)}
                            </FormItem>
                        </Col>
                        <Col span={6}>
                            <FormItem label="优惠金额" labelCol={{ span: 9 }}
                                wrapperCol={{ span: 12 }}
                            >
                                {getFieldDecorator('principalDiscount')(<Input onChange={this.amountReceivable} style={{width: '100px'}} />)}
                            </FormItem>
                        </Col>
                    </Row>
                    <Row gutter={32}>
                        <Col span={8}>
                            <div style={{border: '1px solid #EBEBEB'}}>
                                <div style={titleLayout}>抄表录入</div>
                                <div style={{marginTop: 20}}>
                                    <FormItem
                                        {...formItemLayout}
                                        label="房间编号"
                                    >{getFieldDecorator('roomNumberOne')(
                                            <Select
                                                showSearch
                                                placeholder="请选择房间编号"
                                                optionFilterProp="children"
                                                onChange={this.chooseRoomNumber}
                                            >
                                                {this.state.roomNumberOne.map((roomNumber, i) => {
                                                    return <Option key={roomNumber}>{roomNumber}</Option>
                                                })}
                                            </Select>)
                                        }
                                    </FormItem>
                                    {this.state.powerType === 2 ?
                                        <FormItem
                                            {...formItemLayout}
                                            label="费用名称"
                                        >{getFieldDecorator('moneyType')(
                                                <Select
                                                    showSearch
                                                    placeholder="请选择费用名称"
                                                    optionFilterProp="children"
                                                    onChange={this.chooseMoneyType}
                                                >
                                                    {this.state.bili.map((type) => {
                                                        return <Option key={type.name}>{type.name}</Option>
                                                    })}
                                                </Select>
                                            )}
                                        </FormItem> :
                                        <FormItem
                                            {...formItemLayout}
                                            label="费用名称"
                                        >{getFieldDecorator('electricCostName')(<Input placeholder="请输入内容" />)
                                            }
                                        </FormItem>
                                    }
                                    <FormItem
                                        {...formItemLayout}
                                        label="上次抄表数"
                                    >{getFieldDecorator('lastSurfaceNumber')(<Input id="lastSurfaceNumber" onBlur={this.currentMeterReading} placeholder="请输入内容" />)
                                        }
                                    </FormItem>
                                    <FormItem
                                        {...formItemLayout}
                                        label="本次抄表数"
                                    >{getFieldDecorator('surfaceNumber')(<Input id="surfaceNumber" onBlur={this.currentMeterReading} placeholder="请输入内容" />)
                                        }
                                    </FormItem>
                                    <FormItem
                                        {...formItemLayout}
                                        label="变比"
                                    >{getFieldDecorator('ratio')(<Input placeholder="请输入内容" />)
                                        }
                                    </FormItem>
                                    <FormItem
                                        {...formItemLayout}
                                        label="单价"
                                    >{getFieldDecorator('unitPrice')(<Input placeholder="请输入内容" addonAfter="元/度" />)
                                        }
                                    </FormItem>
                                    <FormItem
                                        {...formItemLayout}
                                        label="本次用电量"
                                    >{getFieldDecorator('needElectricity')(<Input addonAfter="Kwh" />)
                                        }
                                    </FormItem>
                                    <FormItem
                                        {...formItemLayout}
                                        label="备注"
                                    >{getFieldDecorator('remarks')(<Input type="textarea" rows={6} />)
                                        }
                                    </FormItem>
                                    <FormItem {...tailFormItemLayout}>
                                        <Button onClick={this.add} type="primary" htmlType="submit" style={greenButtonStyle} >增加本条记录</Button>
                                    </FormItem>
                                </div>
                            </div>
                        </Col>
                        <Col span={8}>
                            <div style={{border: '1px solid #EBEBEB'}}>
                                <div style={titleLayout}>调差</div>
                                <div style={{marginTop: 20}}>
                                    <FormItem
                                        {...formItemLayout}
                                        label="本月单价："
                                    >{getFieldDecorator('currentMouthUnitPrice')(<Input id="currentMouthUnitPrice" onBlur={this.balancesingleMoney} placeholder="请输入内容" addonAfter="元/度" />)
                                        }
                                    </FormItem>
                                    <FormItem
                                        {...formItemLayout}
                                        label="上月单价："
                                    >{getFieldDecorator('lastMouthUnitPrice')(<Input id="lastMouthUnitPrice" onBlur={this.balancesingleMoney} placeholder="请输入内容" addonAfter="元/度" />)
                                        }
                                    </FormItem>
                                    <FormItem
                                        {...formItemLayout}
                                        label="单价差额："
                                    >{getFieldDecorator('unitPriceBalance')(<Input addonAfter="元/度" />)
                                        }
                                    </FormItem>
                                    <FormItem
                                        {...formItemLayout}
                                        label="上月总用量："
                                    >{getFieldDecorator('lastMouthTotalDosage')(<Input id="lastMouthTotalDosage" onBlur={this.balancesingleMoney} placeholder="请输入内容" addonAfter="Kwh" />)
                                        }
                                    </FormItem>
                                    <FormItem
                                        {...formItemLayout}
                                        label="差额："
                                    >{getFieldDecorator('balance')(<Input addonAfter="元" />)
                                        }
                                    </FormItem>
                                    <FormItem {...tailFormItemLayout}>
                                        <Button onClick={this.addBalance} type="primary" htmlType="submit" style={greenButtonStyle} >增加本条记录</Button>
                                    </FormItem>
                                </div>
                            </div>
                        </Col>
                        <Col span={8}>
                            <div style={{border: '1px solid #EBEBEB'}}>
                                <div style={titleLayout}>录入违约金</div>
                                <div onSubmit={this.handleSubmit} style={{marginTop: 20}}>
                                    <FormItem
                                        {...formItemLayout}
                                        label="违约金名称："
                                    >{getFieldDecorator('liquidatedDamagesName')(<Input placeholder="请输入内容" />)
                                        }
                                    </FormItem>
                                    <FormItem
                                        {...formItemLayout}
                                        label="违约金金额："
                                    >{getFieldDecorator('liquidatedDamagessingleMoney')(<Input placeholder="请输入内容" addonAfter="元" />)
                                        }
                                    </FormItem>
                                    <FormItem {...tailFormItemLayout}>
                                        <Button onClick={this.addLiquidatedDamages} type="primary" htmlType="submit" style={greenButtonStyle} >增加本条记录</Button>
                                    </FormItem>
                                </div>
                            </div>
                        </Col>
                    </Row>
                    {getFieldDecorator('roomId')(<Input type="hidden" />)}
                    {getFieldDecorator('subletId')(<Input type="hidden" />)}
                    {getFieldDecorator('readId')(<Input type="hidden" />)}
                    {getFieldDecorator('subletName')(<Input type="hidden" />)}
                </Form>
            </Modal>
        )
    }
}

let sumElectricityAddUpComponent = Form.create()(sumElectricityAddUp)
export default sumElectricityAddUpComponent
